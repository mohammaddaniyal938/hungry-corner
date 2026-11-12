const initialReviews = [
  {
    id: 1,
    productid: 1,
    username: "Khubair Ali",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80",
    date: "2 days ago",
    rating: 5.0,
    review:
      "Hands down the most flavorful beef burger in Karachi! The brioche bun was so fresh and soft, and the spicy mayo is unmatched.",
    verified: true,
  },
  {
    id: 2,
    productid: 1,
    username: "Ayesha Khan",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    date: "1 week ago",
    rating: 4.8,
    review:
      "Loved the char on the beef patty. Delivered hot within 25 minutes to Gulshan. Will definitely re-order!",
    verified: true,
  },
  {
    id: 3,
    productid: 2,
    username: "Hamza Tariq",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&q=80",
    date: "3 days ago",
    rating: 5.0,
    review: "Super crispy and juicy chicken. Better than international chains by far.",
    verified: true,
  },
  {
    id: 4,
    productid: 2,
    username: "Fatima Noor",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80",
    date: "5 days ago",
    rating: 4.5,
    review: "Crunch is amazing! Just the right amount of spicy kick.",
    verified: true,
  },
  {
    id: 5,
    productid: 3,
    username: "Bilal Ahmed",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    date: "Yesterday",
    rating: 5.0,
    review: "The smash crust is pure perfection. The smoky Texas BBQ sauce elevates it.",
    verified: true,
  },
  {
    id: 6,
    productid: 4,
    username: "Zainab Malik",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
    date: "2 days ago",
    rating: 4.9,
    review: "Proper authentic Lebanese toum garlic taste! Soft pita wrap and loaded with chicken.",
    verified: true,
  },
  {
    id: 7,
    productid: 5,
    username: "Shahzaib Raza",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    date: "4 days ago",
    rating: 4.7,
    review: "Beef was tender and well spiced with authentic Karachi flavor.",
    verified: true,
  },
  {
    id: 8,
    productid: 6,
    username: "Mahnoor Sheikh",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
    date: "3 days ago",
    rating: 5.0,
    review: "Generous cheese and fajita toppings. The crust had a great crisp.",
    verified: true,
  },
  {
    id: 9,
    productid: 10,
    username: "Daniyal Qureshi",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&q=80",
    date: "Just now",
    rating: 5.0,
    review:
      "These loaded dynamite fries are addictive! Melted cheese and chicken bites everywhere.",
    verified: true,
  },
  {
    id: 10,
    productid: 14,
    username: "Saad Rehman",
    avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&q=80",
    date: "Yesterday",
    rating: 4.9,
    review: "Best midnight deal in Karachi. Feeds 2 hungry people easily with great savings.",
    verified: true,
  },
];

const LOCAL_STORAGE_KEY = "karachi_bites_user_reviews";

export const getStoredReviews = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return [...parsed, ...initialReviews];
    }
  } catch (e) {
    console.warn("Could not load reviews from localStorage", e);
  }
  return initialReviews;
};

export const getReviewsByProductId = (productId) => {
  const allReviews = getStoredReviews();
  return allReviews.filter((r) => String(r.productid) === String(productId));
};

export const countReviews = (productId) => {
  const reviews = getReviewsByProductId(productId);
  return reviews.length > 0 ? reviews.length : 12;
};

export const addReviewToStorage = (newReview) => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing = saved ? JSON.parse(saved) : [];
    existing.unshift({
      ...newReview,
      id: Date.now(),
      date: "Just now",
      verified: true,
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (e) {
    console.error("Error saving review", e);
    return false;
  }
};
