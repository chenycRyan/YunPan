<template>
  <div class="file-input-wrapper">
    <button class="btn">选择文件</button>
    <input ref="fileIptRef" class="file-ipt" type="file" webkitdirectory directory multiple @change="handleFileSelect" />
  </div>
</template>
<script setup>
import { vLoading } from 'element-plus'
// 获取当前选中的文件夹数据
const handleFileSelect = event => {
  //文件夹里面所有文件
  let files = event.target.files
  //文件夹名称
  let relativePath = files[0].webkitRelativePath
  let folderName = relativePath.split('/')[0]
  console.log(files, folderName)
  const paths = Array.from(files).map(item => item.webkitRelativePath)
  const pathList = Array.from(
    new Set(
      paths.map(item => {
        return item.slice(0, item.lastIndexOf('/'))
      })
    )
  )
  console.log(pathList)
}

function buildTree(path, value) {
  if (path.length === 0) {
    return { name: value, children: [] }
  }
  const [currentNode, ...remainingNodes] = path
  const existingNode = currentNode.children.find(node => node.name === value)
  if (existingNode) {
    return {
      ...currentNode,
      children: [...currentNode.children.filter(node => node.name !== value), buildTree(existingNode.children, value)]
    }
  } else {
    return {
      ...currentNode,
      children: [...currentNode.children, buildTree(remainingNodes, value)]
    }
  }
}

function pathToTreeArray(paths) {
  const result = []

  paths.forEach(path => {
    const parts = path.split('/')
    result.push(buildTree(result, parts[0]))
  })

  return result
}
onMounted(() => {
  const paths = ['bz', 'bz/而是', 'bz/zz', 'bz/zz/bb', 'bz/zz/bb/dd']
  const treeArray = pathToTreeArray(paths)
})
let btnLoading = ref(true)
</script>
<style lang="scss" scoped>
.file-input-wrapper {
  position: relative;
}

.file-input-wrapper input[type='file'] {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
}

.btn {
  background-color: #007bff;
  color: #fff;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
