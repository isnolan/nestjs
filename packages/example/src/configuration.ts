// 导出配置
export default () => {
  return {
    nacos: {
      server: `${process.env.NACOS_SERVICE_HOST}:${process.env.NACOS_SERVICE_PORT}`,
      namespace: process.env.NACOS_NAMESPACE,
    },
  };
};
