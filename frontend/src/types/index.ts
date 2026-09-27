export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isVerified?: boolean;
};

export type ConnectionItem = {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    profile?: {
      profilePhoto?: string | null;
      occupationType?: string | null;
    };
  };
  receiver?: {
    id: string;
    name: string;
    profile?: {
      profilePhoto?: string | null;
      occupationType?: string | null;
    };
  };
};
