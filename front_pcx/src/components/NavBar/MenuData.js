/**
 * MenuData.js
 * Contains navigation menu configuration data
 */
import { faCartShopping, faHouse, faUser } from '@fortawesome/free-solid-svg-icons'
import { faBuffer } from '@fortawesome/free-brands-svg-icons'

/**
 * Navigation menu items configuration
 * Each item contains:
 * - title: Display text for the menu item
 * - url: Target URL for the menu item
 * - className: CSS class name for styling
 * - icon: FontAwesome icon for the menu item
 */
export const MenuData = [
    {
        title: "Home",
        url: "/",
        className: "nblinks",
        icon: faHouse
    },
    {
        title: "Products",
        url: "/products",
        className: "nblinks",
        icon: faBuffer
    },
    {
        title: "Account",
        url: "#",
        className: "nblinks",
        icon: faUser
    },
    // {
    //     title:"Categories",
    //     url:"#",
    //     cNAme:"nblinks",
    //     icon:faLocationDot
    // },
    // {
    //     title:"Address",
    //     url:"#",
    //     cNAme:"nblinks",
    //     icon:faLocationDot
    // },
    {
        title: "Cart",
        url: "/checkout",
        className: "nblinks",
        icon: faCartShopping
    },
    // {
    //     title:"Cart",
    //     url:"#",
    //     cNAme:"nblinks",
    //     icon:faCartShopping
    // },
]