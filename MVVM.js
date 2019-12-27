let tempObserver = null

class MVVM {
  constructor(options) {
    this.$el = options.$el
    this.$data = options.data
    this.$$data = this.$data()
    this.$methods = options.methods
    this.$template = options.template
    this.$options = options
    this.RegUtils = {
      regText: /.*\{\{(.*)\}\}/,
      regV: /^v-(.*)$/,
      regAT: /^@(.*)$/
    }
    this.directive = {
      model: (propName, node) => {
        tempObserver = new Observable(node, propName, this.$$data)
        node.value = this.$$data[propName]
        node.addEventListener('input', (e) => {
          this.$$data[propName] = e.target.value
        })
      }
    }
    this.event = {
      click: (propName, node) => {
        node.addEventListener('click', (e) => {
          this.$methods[propName](e)
        })
      }
    }

    this.init()
  }

  /**
   * 初始化
   */
  init() {
    this.defineReactive(this.$$data)
    this.compiler(this.$template, this.$$data)
  }

  /**
   * 创建可观察对象
   * @param obj
   * @param value
   * @returns {*}
   */
  defineReactive(obj) {
    let tempValue = null

    for (const key in obj) {
      tempValue = obj[key]
      let observer = new Observer()
      Object.defineProperty(obj, key, {
        set(v) {
          tempValue = v
          // console.log('触发了set+', tempValue)
          observer.notify()
        },
        get() {
          // console.log('触发了get')
          if (tempObserver) {
            observer.subscribe()
            tempObserver = null
          }
          return tempValue
        }
      })
    }
  }

  /**
   * 编译解析dom
   */
  compiler() {
    var app = document.querySelector(this.$el)
    app.innerHTML = this.$template
    let nodes = app.children[0].childNodes
    // 获取节点类型(文本=3/元素=1)
    for (const node of nodes) {
      if (node.nodeType === 1) {
        for (let attr of node.attributes) {
          let vDirective = this.RegUtils.regV.exec(attr.nodeName)
          if (vDirective) {
            this.directive[vDirective[1]] && this.directive[vDirective[1]](attr.nodeValue, node)
          }
          let vEvent = this.RegUtils.regAT.exec(attr.nodeName)
          if (vEvent) {
            this.event[vEvent[1]] && this.event[vEvent[1]](attr.nodeValue, node)
          }
        }
      } else if (node.nodeType === 3) {
        let result = this.RegUtils.regText.exec(node.nodeValue)
        if (result) {
          this.textMatch(result[1].trim(), node)
        }
      }
    }
  }

  /**
   * 匹配文本节点{{}}
   * @param propsName 匹配data中的变量
   * @param node 当前匹配的节点, 替换成data中的变量值
   */
  textMatch(propsName, node) {
    tempObserver = new Observable(node, propsName, this.$$data)
    node.nodeValue = this.$$data[propsName]
  }


}

/**
 * 创建可观察对象管理
 */
class Observable {
  constructor(node, propName, data) {
    // console.log(node, propName, data)
    this.$node = node
    this.$propName = propName
    this.$data = data
  }

  update() {
    if (this.$node.nodeType === 1) {
      // 元素节点
      this.$node.value = this.$data[this.$propName]
    } else if (this.$node.nodeType === 3) {
      // 文本节点
      this.$node.nodeValue = this.$data[this.$propName]
    }
  }
}


class Observer {
  constructor() {
    this.observers = []
  }

  /**
   * 通知
   */
  notify() {
    this.observers.forEach(item => {
      item.update()
    })
  }

  /**
   * 订阅
   */
  subscribe() {
    this.observers.push(tempObserver)
  }
}
