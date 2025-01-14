export type Product = {
	ID?: number;
	currency?: string;
	price?: number;
	title?: string;
	interval?: string;
	buyer_can_change_amount?: boolean;
	multiple_per_user?: boolean;
	welcome_email_content?: string;
	subscribe_as_site_subscriber?: boolean;
	renewal_schedule?: string;
	type?: string;
	is_editable?: boolean;
	tier?: number;
};

export type Query = {
	[ key: string ]: string;
};

export type Subscriber = {
	id: string;
	status: string;
	start_date: string;
	end_date: string;
	// appears as both subscriber.user_email & subscriber.user.user_email in this file
	user_email: string;
	user: {
		ID: string;
		name: string;
		user_email: string;
	};
	plan: {
		connected_account_product_id: string;
		title: string;
		renewal_price: number;
		currency: string;
		renew_interval: string;
	};
	renew_interval: string;
	all_time_total: number;
};
