export default interface List {
    entries: Entry[]
}

export interface Entry {
    title: string,
    checked: boolean,
    sub_entries: SubEntry[]
}

export interface SubEntry {
    title: string,
    checked: boolean
}