export interface Endorsement { message: string; endorserName: string }
// No sample testimonials: show an empty state until a card-scoped data source is connected.
export const useEndorsements = (): Endorsement[] => [];
