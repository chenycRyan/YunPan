export default function useFileSelect(currentInstance) {
  const selectRows = ref([])
  let vueInstance = null

  if (currentInstance) {
    vueInstance = currentInstance
  }
  //清除选中
  const clearSelection = () => {
    vueInstance.proxy.$refs.fileTableRef.clearSelection()
  }
  //设置全选
  const toggleAllSelection = () => {
    vueInstance.proxy.$refs.fileTableRef.toggleAllSelection()
  }
  //设置选中
  const toggleRowSelection = (row, selected) => {
    vueInstance.proxy.$refs.fileTableRef.toggleRowSelection(row, selected)
  }

  // 文件是否可被选择
  const checkSelectable = () => {
    return true
  }

  // 当前最后选中的文件行
  const selectRow = computed(() => {
    if (selectRows.value.length > 0) {
      return selectRows.value[selectRows.value.length - 1]
    } else {
      return null
    }
  })

  // 当前选中的文件
  const selectFiles = computed(() => {
    return selectRows.value.filter(row => {
      return row.type !== 'FOLDER'
    })
  })

  // 当前选中的文件夹
  const selectFolders = computed(() => {
    return selectRows.value.filter(row => {
      return row.type === 'FOLDER'
    })
  })

  // 更新选中的文件列表
  const selectRowsChange = selection => {
    selectRows.value = selection
  }

  // 行选中 class
  const tableRowClassName = ({ row, rowIndex }) => {
    row.index = rowIndex
    return selectRows.value.indexOf(row) !== -1 ? 'select-row' : ''
  }

  // 多选统计信息
  const selectStatistics = computed(() => {
    let selectRowsLength = selectRows.value.length
    let selectFilesLength = selectFiles.value.length
    let selectFoldersLength = selectFolders.value.length
    let isSingleSelect = selectRowsLength === 1
    let isMultiSelect = selectRowsLength > 1
    let isAllFile = selectFilesLength === selectRowsLength
    let isAllFolder = selectFoldersLength === selectRowsLength

    return {
      isSingleSelect,
      isMultiSelect,
      isAllFile,
      isAllFolder
    }
  })

  return {
    checkSelectable,
    tableRowClassName,
    selectRowsChange,
    selectRow,
    selectRows,
    selectFiles,
    selectFolders,
    selectStatistics,
    clearSelection,
    toggleRowSelection,
    toggleAllSelection
  }
}
