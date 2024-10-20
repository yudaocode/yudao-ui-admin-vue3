export default class Friend {
  public id: string
  public avatar: string
  public name: string
  public description: string
  public createTime: number

  constructor(id, avatar, name, description, createTime) {
    this.id = id
    this.avatar = avatar
    this.name = name
    this.description = description
    this.createTime = createTime
  }
}
