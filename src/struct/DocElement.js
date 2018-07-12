const DocBase = require('./DocBase')
const { stripIndents } = require('common-tags')

const types = {
  CLASS: 'class',
  EVENT: 'event',
  INTERFACE: 'interface',
  METHOD: 'method',
  PARAM: 'param',
  PROP: 'prop',
  TYPEDEF: 'typedef'
}

class DocElement extends DocBase {
  constructor (doc, docType, { name, description, meta }, parent) {
    super()
    this.doc = doc
    this.docType = docType
    this.parent = parent || null

    this.name = name
    this.description = description
    this.meta = meta

    this.return = null
    this.examples = null
    this.type = null
  }

  childrenOfType (type) {
    const filtered = this.children.filter(child => child.docType === type)
    return filtered.size ? filtered : null
  }

  get props () {
    return this.childrenOfType(types.PROP)
  }

  get methods () {
    return this.childrenOfType(types.METHOD)
  }

  get events () {
    return this.childrenOfType(types.EVENT)
  }

  get params () {
    return this.childrenOfType(types.PARAM)
  }

  get url () {
    const path = this.parent
      ? `${this.parent.docType}/${this.parent.name}?scrollTo=${this.static ? 's-' : ''}${this.name}`
      : `${this.docType}/${this.name}`

    return this.doc.baseURL + path
  }

  get sourceURL () {
    const { path, file, line } = this.meta
    return `${this.doc.repoURL}${path}/${file}#L${line}`
  }

  get formattedName () {
    return this.name
  }

  get formattedReturn () {
    return this.returns
  }

  get formattedType () {
    return this.doc.formatType(this.type)
  }

  get link () {
    return `[${this.formattedName}](${this.url})`
  }

  get static () {
    return this.scope === 'static'
  }

  get typeElement () {
    if (!this.type) return null

    return this.type
      .filter(text => /^\w+$/.test(text))
      .map(text => this.doc.children.get(text.toLowerCase()))
      .find(elem => elem)
  }

  embed () {
    const embed = this.doc.baseEmbed()
    let name = `__**${this.link}**__`

    if (this.extends) {
      const baseClass = this.doc.get(this.extends[0]) || this.extends[0]
      name += ` (extends **${typeof baseClass === 'string' ? baseClass : baseClass.link}**)`
    }

    if (this.access === 'private') name += ' **PRIVATE**'

    embed.setDescription(`${name}\n${this.formatText(this.description)}`).setURL(this.url)

    this.formatEmbed(embed)

    return embed.addField('\u200b', `[View source](${this.sourceURL})`)
  }

  formatEmbed (embed) {
    this.attachProps(embed)
    this.attachMethods(embed)
    this.attachEvents(embed)
    this.attachParams(embed)
    this.attachType(embed)
    this.attachReturn(embed)
    this.attachExamples(embed)
  }

  attachProps (embed) {
    if (!this.props) return
    embed.addField('Properties', this.props.map(prop => `\`${prop.name}\``).join(' '))
  }

  attachMethods (embed) {
    if (!this.methods) return
    embed.addField('Methods', this.methods.map(method => `\`${method.name}\``).join(' '))
  }

  attachEvents (embed) {
    if (!this.events) return
    embed.addField('Events', this.events.map(event => `\`${event.name}\``).join(' '))
  }

  attachParams (embed) {
    if (!this.params) return
    const params = this.params.map(
      param => stripIndents`
      ${param.formattedName} ${param.formattedType}
      ${param.description}
    `
    )

    embed.addField('Params', params.join('\n\n'))
  }

  attachReturn (embed) {
    if (!this.returns) return
    embed.addField('Returns', this.formattedReturn)
  }

  attachType (embed) {
    if (!this.type) return
    embed.addField('Type', this.formattedType)
  }

  attachExamples (embed) {
    if (!this.examples) return
    embed.addField('Examples', this.examples.map(ex => `\`\`\`js\n${ex}\n\`\`\``).join('\n'))
  }

  formatText (text) {
    if (!text) return ''
    return text
      .replace(/\{@link (.+?)\}/g, (match, name) => {
        const element = this.doc.get(name)
        return element ? element.link : name
      })
      .replace(/(```[^]+?```)|(^[*-].+$)?\n(?![*-])/gm, (match, codeblock, hasListBefore) => {
        if (codeblock) return codeblock
        if (hasListBefore) return match
        return ' '
      })
      .replace(/<(info|warn)>([^]+?)<\/(?:\1)>/g, '\n**$2**\n')
  }

  static get types () {
    return types
  }
}

module.exports = DocElement
