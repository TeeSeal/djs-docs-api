const { Collection } = require('discord.js')

class DocBase {
  constructor () {
    this.children = new Collection()
  }

  addChild (child) {
    this.children.set(child.name.toLowerCase(), child)
  }

  adoptAll (enumerable, Constructor) {
    if (!enumerable) return
    for (const elem of enumerable) {
      this.addChild(new Constructor(this, elem))
    }
  }
}

module.exports = DocBase
