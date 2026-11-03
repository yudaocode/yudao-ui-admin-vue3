export interface LinkItem {
  text: string
  url?: string
  onClick?: () => void
}

export interface IAgreeProps {
  text: string
  link: LinkItem[]
}
