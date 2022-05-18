export interface Offer {
    idadvertisement: number;
    title: string;
    description: string;
    more_info: string;
    additional: string;
    price: number;
    discount: number;
    type: number;
    weekly: boolean;
}

export interface CreateOfferDTO extends Omit<Offer, 'idadvertisement' | 'more_info'> {
}