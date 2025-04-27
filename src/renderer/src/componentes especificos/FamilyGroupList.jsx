const buildHierarchy = (data) => {
  const tree = []
  const childrenOf = {}

  data.forEach((item) => {
    childrenOf[item.id] = []
  })

  data.forEach((item) => {
    if (item.parent_group_id) {
      childrenOf[item.parent_group_id].push(item)
    } else {
      tree.push(item)
    }
  })

  const attachChildren = (nodes) => {
    nodes.forEach((node) => {
      const children = childrenOf[node.id]
      if (children && children.length > 0) {
        node.children = children
        attachChildren(children)
      }
    })
  }

  attachChildren(tree)
  return tree
}

export default buildHierarchy
