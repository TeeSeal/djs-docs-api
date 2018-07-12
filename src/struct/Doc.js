const request = require('snekfetch')
const Fuse = require('fuse.js')
const { MessageEmbed } = require('discord.js')

const DocBase = require('./DocBase')
const DocClass = require('./DocClass')
const DocTypedef = require('./DocTypedef')
const DocInterface = require('./DocInterface')

const docCache = new Map()
const ICON = 'https://i.imgur.com/LM8YCyk.png'

class Doc extends DocBase {
  constructor (name, docs) {
    super()
    this.name = name
    this.docs = docs
    this.baseURL = `https://discord.js.org/#/docs/${name}/`
    this.repoURL = Doc.getRepoURL(name)

    this.adoptAll(docs.classes, DocClass)
    this.adoptAll(docs.typedefs, DocTypedef)
    this.adoptAll(docs.interfaces, DocInterface)

    this.fuse = new Fuse(this.toJSON(), {
      shouldSort: true,
      threshold: 0.5,
      location: 0,
      distance: 80,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['name', 'id'],
      id: 'id'
    })

    docCache.set(name, this)
  }

  formatType (types) {
    const typestring = types
      .map((text, index) => {
        if (/<|>|\*/.test(text)) {
          return text
            .split('')
            .map(char => `\\${char}`)
            .join('')
        }

        const typeElem = this.children.get(text.toLowerCase())
        const prependOr = index !== 0 && /\w|>/.test(types[index - 1]) && /\w/.test(text)

        return (prependOr ? '|' : '') + (typeElem ? typeElem.link : text)
      })
      .join('')

    return `**${typestring}**`
  }

  get (query) {
    const terms = query.split(/\.|#/).map(text => text.toLowerCase())

    let elem = this.children.get(terms.shift())
    if (!elem || !terms.length) return elem || null

    while (terms.length) {
      const term = terms.shift()
      const child = elem.children.get(term)

      if (!child) return null
      elem = terms.length && child.typeElement ? child.typeElement : child
    }

    return elem
  }

  search (query) {
    const result = this.fuse.search(query).slice(0, 10)
    if (!result.length) return null
    return result.map(name => this.get(name))
  }

  resolveEmbed (query) {
    const element = this.get(query)
    if (element) return element.embed()

    const searchResults = this.search(query)
    if (!searchResults) return null

    return this.baseEmbed()
      .setTitle(`Search results:`)
      .setDescription(searchResults.map(el => `**${el.link}**`).join('\n'))
  }

  toJSON () {
    const parents = this.children.map(({ name }) => ({ id: name, name }))

    const children = this.children
      .map(parent =>
        parent.children.map(child => ({
          id: `${parent.name}#${child.name}`,
          name: child.name
        })))
      .reduce((a, b) => a.concat(b))

    return parents.concat(children)
  }

  baseEmbed () {
    const [docs, branch] = this.name.split('/')
    const author = {
      rpc: 'RPC Docs',
      commando: 'Commando Docs',
      main: `Discord.js Docs (${branch})`
    }[docs]

    return new MessageEmbed().setAuthor(author, ICON).setColor(0x2296f3)
  }

  static getRepoURL (id) {
    const [name, branch] = id.split('/')
    const project = {
      main: 'discord.js',
      rpc: 'RPC',
      commando: 'Commando'
    }[name]

    return `https://github.com/discordjs/${project}/blob/${branch}/`
  }

  static async fetch (version) {
    const [dev, project, branch, name] = {
      commando: ['Gawdl3y', 'discord.js-commando', 'master', 'commando/master'],
      rpc: ['devsnek', 'discord-rpc', 'master', 'rpc/master']
    }[version] || ['hydrabolt', 'discord.js', version, `main/${version}`]

    if (docCache.has(name)) return docCache.get(name)

    const { text } = await request.get(`https://raw.githubusercontent.com/${dev}/${project}/docs/${branch}.json`)

    return new Doc(name, JSON.parse(text))
  }
}

module.exports = Doc
