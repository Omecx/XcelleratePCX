import { 
    faHome, 
    faShoppingBag, 
    faBoxes, 
    faUsers, 
    faChartLine,
    faUser,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

export const MenuData = [
    {
        title: 'Dashboard',
        path: '/vendor/dashboard',
        icon: faHome
    },
    {
        title: 'Products',
        path: '/vendor/products',
        icon: faBoxes
    },
    {
        title: 'Orders',
        path: '/vendor/orders',
        icon: faShoppingBag
    },
    {
        title: 'Customers',
        path: '/vendor/customers',
        icon: faUsers
    },
    {
        title: 'Analytics',
        path: '/vendor/analytics',
        icon: faChartLine
    },
    {
        title: 'Profile',
        path: '/vendor/profile',
        icon: faUser
    },
    {
        title: 'Logout',
        path: '/logout',
        icon: faSignOutAlt
    }
];