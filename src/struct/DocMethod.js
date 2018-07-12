const DocElement = require('./DocElement')
const DocParam = require('./DocParam')
const { flatten } = require('../../util/Util')

class DocMethod extends DocElement {
  constructor (parent, data) {
    super(parent.doc, DocElement.types.METHOD, data, parent)

    this.access = data.access || 'public'
    this.examples = data.examples || null
    this.returns = data.returns
    this.scope = data.scope
    this.adoptAll(data.params, DocParam)
  }

  get formattedName () {
    return [this.parent.name, this.static ? '.' : '#', this.name, '()'].join('')
  }

  get formattedReturn () {
    if (!this.returns) return `**Void**`
    const type = this.returns.types || this.returns
    return [this.doc.formatType(flatten(type)), this.returns.description].filter(text => text).join('\n')
  }
}

module.exports = DocMethod
