import { CollectionReference, DocumentData, DocumentReference, DocumentSnapshot } from '@google-cloud/firestore';
import { FieldValue, Firestore, Query, QuerySnapshot, Timestamp, WriteResult } from '@google-cloud/firestore';
import { Inject, Injectable, InternalServerErrorException, NotFoundException, Type as NestType } from '@nestjs/common';

import { FIRESTORE_CLIENT } from './firestore.module';

// 定义一个基础实体接口，强制包含 id
// Firestore 文档本身没有 id 字段，id 是文档的引用名称
// 我们在读取时将其映射到对象上
export abstract class BaseEntity {
  id: string;

  created_at: Timestamp;

  updated_at: Timestamp;

  // 构造函数，方便从 Firestore 数据创建实例
  constructor(partial: Partial<BaseEntity>) {
    Object.assign(this, partial);
  }
}

@Injectable()
export abstract class BaseFirestoreRepository<T extends BaseEntity> {
  protected collection: CollectionReference<DocumentData>;

  constructor(
    @Inject(FIRESTORE_CLIENT) protected readonly firestore: Firestore,
    protected readonly collectionName: string,
    private readonly entityType: NestType<T>,
  ) {
    this.collection = this.firestore.collection(collectionName);
  }

  /**
   * 将 Firestore 文档快照转换为实体类的实例 T。
   *
   * !! 重要限制 !!
   * 当前实现使用 Object.assign 进行浅拷贝，以规避 class-transformer 处理 Firestore Timestamp 的问题。
   * 这意味着：
   * 1. 不支持嵌套对象/数组的自动类实例转换 (例如，不会将普通对象数组转为嵌套实体类数组)。
   * 2. 会忽略实体类上定义的、用于 plainToInstance 阶段的 @Transform 装饰器。
   *
   * 如果需要嵌套转换或 @Transform 功能，需要采用其他映射策略
   * (例如自定义的 plainToInstance 包装器或等待 class-transformer 修复)。
   *
   * @param doc - Firestore DocumentSnapshot
   * @returns 实体类的实例 T 或 null
   */
  protected mapDocToEntity(doc: DocumentSnapshot): T | null {
    if (!doc.exists) {
      return null;
    }
    const data = doc.data();
    if (!data) {
      console.warn(`Document ${doc.id} exists but has no data.`);
      return null;
    }

    const entityData = { id: doc.id, ...data };

    try {
      // 创建空实例 (依赖构造函数能处理空对象或默认值)
      const entityInstance = new this.entityType({} as Partial<T>);
      // 浅拷贝属性
      Object.assign(entityInstance, entityData);
      // 确保 ID 被设置 (Object.assign 应该已经处理了, 但双重保险无害)
      entityInstance.id = doc.id;

      return entityInstance;
    } catch (error) {
      console.error(`Error during manual mapping for ${this.entityType.name} (ID: ${doc.id}):`, error);
      console.error('Data passed:', entityData);
      // 抛出更具体的错误可能有助于调试
      throw new InternalServerErrorException(
        `Failed to map document ${doc.id} to entity ${this.entityType.name}. Check constructor and data.`,
        { cause: error },
      );
    }
  }

  /**
   * 创建一个新文档，并返回包含服务器生成的时间戳的完整实体实例。
   * @param data - 要创建的数据 (不包含 id, created_at, updated_at)
   * @returns 创建后的完整实体实例
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const docDataToSave = {
      ...data,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };
    try {
      const docRef = await this.collection.add(docDataToSave);
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new InternalServerErrorException(
          `Document ${docRef.id} not found immediately after creation in ${this.collectionName}.`,
        );
      }
      return this.mapDocToEntity(docSnapshot);
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      if (error instanceof InternalServerErrorException) throw error; // 避免包装已知错误
      throw new InternalServerErrorException(`Failed to create document in ${this.collectionName}.`, { cause: error });
    }
  }

  /**
   * 使用指定的 ID 创建或完全覆盖一个文档。
   * 谨慎使用，因为它会覆盖整个文档。通常 `update` 或 `create` 更常用。
   * @param id - 文档 ID
   * @param data - 要设置的数据 (不包含 id)
   * @returns WriteResult
   */
  async set(id: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<WriteResult> {
    const now = FieldValue.serverTimestamp();
    const docData = { ...data, created_at: now, updated_at: now };
    try {
      return await this.collection.doc(id).set(docData);
    } catch (error) {
      console.error(`Error setting document ${id} in ${this.collection.path}:`, error);
      throw new InternalServerErrorException('Failed to set document.');
    }
  }

  /**
   * 获取集合中的所有文档。
   * 注意：对于非常大的集合，这可能效率低下且成本高昂，考虑分页或限制查询。
   * @returns 实体对象的实例数组或单个实例
   */
  async findAll(): Promise<T[]> {
    try {
      const snapshot: QuerySnapshot<DocumentData> = await this.collection.get();
      return snapshot.docs.map((doc) => this.mapDocToEntity(doc)).filter((entity): entity is T => entity !== null);
    } catch (error) {
      console.error(`Error finding all documents in ${this.collection.path}:`, error);
      throw new InternalServerErrorException('Failed to retrieve documents.');
    }
  }

  /**
   * 根据 ID 查找单个文档。
   * @param id - 文档 ID
   * @returns 实体对象 T 的实体对象的实例数组或单个实例
   */
  async findById(id: string): Promise<T | null> {
    try {
      const docRef: DocumentReference<DocumentData> = this.collection.doc(id);
      const docSnapshot: DocumentSnapshot<DocumentData> = await docRef.get();
      return this.mapDocToEntity(docSnapshot);
    } catch (error) {
      console.error(`Error finding document ${id} in ${this.collection.path}:`, error);
      throw new InternalServerErrorException('Failed to retrieve document.');
    }
  }

  /**
   * 根据 ID 更新文档的部分字段。
   * 只会修改传入 data 中存在的字段，并自动更新 updated_at。
   * @param id - 文档 ID
   * @param data - 要更新的字段 (Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>)
   * @returns WriteResult
   * @throws NotFoundException 如果文档不存在
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<WriteResult> {
    const docRef = this.collection.doc(id);
    // 准备更新数据，确保不意外包含 id, created_at
    /* eslint @typescript-eslint/no-unused-vars: */
    const { id: ignoredId, created_at: ignoredCreatedAt, updated_at: ignoredUpdatedAt, ...updatePayload } = data as any;
    const updateData = { ...updatePayload, updated_at: FieldValue.serverTimestamp() };

    try {
      // 使用 update 方法执行部分更新
      return await docRef.update(updateData);
    } catch (error: any) {
      if (error.code === 5) {
        throw new NotFoundException(`Document with id ${id} not found in ${this.collectionName}.`);
      }
      console.error(`Error updating document ${id} in ${this.collectionName}:`, error);
      throw new InternalServerErrorException(`Failed to update document ${id}.`, { cause: error });
    }
  }

  /**
   * 根据 ID 删除文档。
   * @param id - 文档 ID
   * @returns WriteResult
   * @throws NotFoundException 如果尝试删除时文档已不存在（可选检查）
   */
  async delete(id: string): Promise<WriteResult> {
    const docRef = this.collection.doc(id);
    try {
      // Firestore delete() 在文档不存在时不会报错，会成功返回 WriteResult
      // 如果你需要确保文档存在才删除，可以先 findById
      // const exists = await this.findById(id);
      // if (!exists) {
      //   throw new NotFoundException(`Document with id ${id} not found.`);
      // }
      return docRef.delete();
    } catch (error) {
      console.error(`Error deleting document ${id} in ${this.collection.path}:`, error);
      throw new InternalServerErrorException('Failed to delete document.');
    }
  }

  /**
   * 执行一个 Firestore 查询。
   * @param queryFn - 一个接收 CollectionReference 并返回 Query 的函数
   * @returns 查询结果的实体对象的实例数组或单个实例
   */
  protected async findByQuery(queryFn: (ref: CollectionReference<DocumentData>) => Query<DocumentData>): Promise<T[]> {
    try {
      const query = queryFn(this.collection);
      const snapshot = await query.get();
      return snapshot.docs.map((doc) => this.mapDocToEntity(doc)).filter((entity): entity is T => entity !== null);
    } catch (error) {
      console.error(`Error executing query on ${this.collection.path}:`, error);
      throw new InternalServerErrorException('Failed to execute query.');
    }
  }
}
