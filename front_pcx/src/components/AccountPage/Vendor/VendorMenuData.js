import { 
    faCartShopping, 
    faUser, 
    faBoxesPacking, 
    faComputer, 
    faComments, 
    faSignOutAlt, 
    faStore,
    faChartLine
} from '@fortawesome/free-solid-svg-icons';

export const MenuData = [
    {
        title: "Dashboard",
        url: "/vendor/dashboard",
        cName: "sblinks",
        icon: faChartLine
    },
    {
        title: "Profile",
        url: "/vendor/profile",
        cName: "sblinks",
        icon: faUser
    },
    {
        title: "Products",
        url: "/vendor/products",
        cName: "sblinks",
        icon: faBoxesPacking
    },
    {
        title: "Orders",
        url: "/vendor/orders",
        cName: "sblinks",
        icon: faCartShopping
    },
    {
        title: "Store",
        url: "/vendor/store",
        cName: "sblinks",
        icon: faStore
    },
    {
        title: "Reviews",
        url: "/vendor/reviews",
        cName: "sblinks",
        icon: faComments
    },
    {
        title: "Logout",
        url: "/vendor/logout",
        cName: "sblinks",
        icon: faSignOutAlt
    }
]; 