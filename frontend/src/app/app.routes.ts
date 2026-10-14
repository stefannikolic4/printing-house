import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Register } from './register/register';
import { ForgotPassword } from './forgot-password/forgot-password';
import { ResetPassword } from './reset-password/reset-password';
import { AdminLogin } from './admin-login/admin-login';
import { adminGuard } from './guards/admin.guard';

import { Client } from './Client/client/client';
import { ClientProfile } from './Client/client-profile/client-profile';
import { ClientSearch } from './Client/client-search/client-search';
import { ClientCart } from './Client/client-cart/client-cart';
import { ClientTender } from './Client/client-tender/client-tender';
import { ClientArchieve } from './Client/client-archieve/client-archieve';
import { ClientProductDetails } from './Client/client-product-details/client-product-details';
import { ClientProductPrepare } from './Client/client-product-prepare/client-product-prepare';

import { Printer } from './Printer/printer/printer';
import { PrinterProfile } from './Printer/printer-profile/printer-profile';
import { PrinterAddProduct } from './Printer/printer-add-product/printer-add-product';
import { PrinterStock } from './Printer/printer-stock/printer-stock';
import { PrinterImport } from './Printer/printer-import/printer-import';
import { PrinterOrders } from './Printer/printer-orders/printer-orders';
import { PrinterTender } from './Printer/printer-tender/printer-tender';

import { Admin } from './Admin/admin/admin';
import { AdminRequests } from './Admin/admin-requests/admin-requests';
import { AdminUsers } from './Admin/admin-users/admin-users';
import { AdminCategories } from './Admin/admin-categories/admin-categories';
import { AdminStatistic } from './Admin/admin-statistic/admin-statistic';

import { ProductDetails } from './product-details/product-details';

export const routes: Routes = [
    { path: '', component: Home },
    {path: 'prijava',component: Login },
    {path: 'registracija',component: Register },
    {path: 'zaboravljena-lozinka',component: ForgotPassword },
    {path: 'resetuj-lozinku/:token',component: ResetPassword },
    {path: 'admin',component:AdminLogin, pathMatch: 'full'},
    {path: 'proizvod/:id', component: ProductDetails },

    { path: 'klijent', component: Client, children: [
        { path: 'profil', component: ClientProfile },
        { path: 'pretraga', component: ClientSearch },
        { path: 'korpa', component: ClientCart },
        { path: 'javne-nabavke', component: ClientTender },
        { path: 'arhiva', component: ClientArchieve },
        { path: 'proizvod/:id', component: ClientProductDetails },
        { path: 'proizvod/:id/priprema', component: ClientProductPrepare },
    ]},

    { path: 'stampar', component: Printer, children: [
        { path: 'profil', component: PrinterProfile },
        { path: 'proizvodi', component: PrinterAddProduct },
        { path: 'kolicine', component: PrinterStock },
        { path: 'uvoz', component: PrinterImport },
        { path: 'narudzbine', component: PrinterOrders },
        { path: 'licitacije', component: PrinterTender },
    ]},

    { path: 'admin', component: Admin, children: [
        { path: 'zahtevi', component: AdminRequests, canActivate: [adminGuard] },
        { path: 'korisnici', component: AdminUsers, canActivate: [adminGuard] },
        { path: 'kategorije', component: AdminCategories, canActivate: [adminGuard] },
        { path: 'statistika', component: AdminStatistic, canActivate: [adminGuard] },
    ]},
];
