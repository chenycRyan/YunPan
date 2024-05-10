const dev = {
  base_URL: '/wangpanApi',
  // base_URL: 'http://192.168.0.52:9113',
  // 大视频文件判断，超过10M切片上传
  bigFileSize: 1024 * 1024 * 10,
  // 最大上传文件
  maxFileSize: 1024 * 1024 * 700
}
window.appsetings = dev