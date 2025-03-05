import { 
    faHome, 
    faShoppingBag, 
    faHeart, 
    faMapMarkerAlt, 
    faUser,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

export const MenuData = [
    {
        title: 'Dashboard',
        path: '/customer/dashboard',
        icon: faHome
    },
    {
        title: 'Orders',
        path: '/customer/orders',
        icon: faShoppingBag
    },
    {
        title: 'Wishlist',
        path: '/customer/wishlist',
        icon: faHeart
    },
    {
        title: 'Addresses',
        path: '/customer/addresses',
        icon: faMapMarkerAlt
    },
    {
        title: 'Profile',
        path: '/customer/profile',
        icon: faUser
    },
    {
        title: 'Logout',
        path: '/logout',
        icon: faSignOutAlt
    }
];