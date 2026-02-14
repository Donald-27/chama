/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */

// AUTO-GENERATED PAGES CONFIG
// This file maps page component files from `src/pages/` to the router.
// Edit the `mainPage` value below to change the app landing page.

import ChamaDetail from './pages/ChamaDetail';
import ChamaSettings from './pages/ChamaSettings';
import Chat from './pages/Chat';
import Contribute from './pages/Contribute';
import ContributionSummary from './pages/ContributionSummary';
import CreateChama from './pages/CreateChama';
import FineSummary from './pages/FineSummary';
import Home from './pages/Home';
import InviteMembers from './pages/InviteMembers';
import LoanCalculator from './pages/LoanCalculator';
import LoanRequest from './pages/LoanRequest';
import LoanSummary from './pages/LoanSummary';
import ManualPayment from './pages/ManualPayment';
import MyGroups from './pages/MyGroups';
import Reports from './pages/Reports';
import AccountBalances from './pages/AccountBalances';
import ScanQR from './pages/ScanQR';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';

export const PAGES = {
    "ChamaDetail": ChamaDetail,
    "ChamaSettings": ChamaSettings,
    "Chat": Chat,
    "Contribute": Contribute,
    "ContributionSummary": ContributionSummary,
    "CreateChama": CreateChama,
    "FineSummary": FineSummary,
    "Home": Home,
    "InviteMembers": InviteMembers,
    "LoanCalculator": LoanCalculator,
    "LoanRequest": LoanRequest,
    "LoanSummary": LoanSummary,
    "ManualPayment": ManualPayment,
    "MyGroups": MyGroups,
    "Reports": Reports,
    "AccountBalances": AccountBalances,
    "ScanQR": ScanQR,
    "Settings": Settings,
    "Transactions": Transactions,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
}

