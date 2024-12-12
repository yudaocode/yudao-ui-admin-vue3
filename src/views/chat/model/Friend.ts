export default class Friend {
  public id: string
  public avatar: string
  public name: string
  public description: string
  public createTime: number
  public deptId: number
  public deptName: string

  constructor(id, avatar, name, description, createTime, deptId, deptName) {
    this.id = id
    this.avatar = avatar
    this.name = name
    this.description = description
    this.createTime = createTime
    this.deptId = deptId
    this.deptName = deptName
  }
}
