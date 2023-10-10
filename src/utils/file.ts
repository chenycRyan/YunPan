/**
 * 文件细化类型
 */
export function displayFileType(name: string) {
  // 文件分类
  const fileTypeMap = {
    Pdf: ['pdf'],
    Txt: ['txt', 'md'],
    Word: ['doc', 'docx'],
    Excel: ['xls', 'xlsx'],
    Zip: ['7z', 'rar', 'zip', 'apz', 'ar', 'bz', 'car', 'dar', 'cpgz', 'f', 'ha', 'hbc', 'hbc2', 'hbe', 'hpk', 'hyp'],
    MP3: ['wav', 'mp3', 'wma', 'vqf', 'mov'],
    MP4: ['wmv', 'mp4', 'webm', 'm3u8', 'rmvb', 'avi', 'swf', '3gp', 'mkv', 'flv'],
    Program: [
      'scss',
      'sass',
      'kt',
      'gitignore',
      'bat',
      'yml',
      'css',
      'js',
      'xml',
      'py',
      'go',
      'html',
      'less',
      'php',
      'rb',
      'rust',
      'script',
      'java',
      'sh',
      'sql'
    ]
  }

  let suffix = name.substr(name.lastIndexOf('.') + 1).toLowerCase()
  let fileType = 'Unknown'
  Object.keys(fileTypeMap).forEach(item => {
    if (fileTypeMap[item].includes(suffix)) fileType = item
  })
  return fileType
}

/**
 * 文件细化类型
 */
export function filterFileType(name: string) {
  // 文件分类
  const fileTypeMap = {
    pdf: ['pdf'],
    md: ['md'],
    docx: ['docx'],
    xlsx: ['xlsx'],
    text: [
      'scss',
      'sass',
      'kt',
      'gitignore',
      'bat',
      'yml',
      'css',
      'js',
      'xml',
      'txt',
      'py',
      'go',
      'html',
      'less',
      'php',
      'rb',
      'rust',
      'script',
      'java',
      'sh',
      'sql'
    ]
  }

  let suffix = name.substr(name.lastIndexOf('.') + 1).toLowerCase()
  let fileType = null
  Object.keys(fileTypeMap).forEach(item => {
    if (fileTypeMap[item].includes(suffix)) fileType = item
  })
  return fileType
}
/**
 * 文件上传分类
 */
export function filterFileClassify(name: string) {
  // 文件分类
  const fileTypeMap = {
    PICTURE: ['gif', 'jpg', 'jpeg', 'png', 'bmp', 'webp', 'ico'],
    VIDEO: ['wmv', 'mp4', 'webm', 'm3u8', 'rmvb', 'avi', 'swf', '3gp', 'mkv', 'flv'],
    DOCUMENT: [
      'doc',
      'docx',
      'xls',
      'xlsx',
      'pdf',
      'txt',
      'md',
      'ppt',
      'pptx',
      'scss',
      'sass',
      'kt',
      'gitignore',
      'bat',
      'yml',
      'css',
      'js',
      'xml',
      'txt',
      'py',
      'go',
      'html',
      'less',
      'php',
      'rb',
      'rust',
      'script',
      'java',
      'sh',
      'sql'
    ]
  }

  let suffix = name.substr(name.lastIndexOf('.') + 1).toLowerCase()
  let fileType = 'OTHER'
  Object.keys(fileTypeMap).forEach(item => {
    if (fileTypeMap[item].includes(suffix)) fileType = item
  })
  return fileType
}
