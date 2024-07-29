import express from 'express';
import { ProductModel, getProducts } from '../../../../../models/product';
const { simpleSitemapAndIndex } = require('sitemap');


export const generateSitemaps = async(req: express.Request, res: express.Response) => {
    
    //https://denooj.com/admin/sitemaps/sitemap-index.xml
    //https://denooj.com/admin/sitemaps/sitemap-0.xml

    const products = await getProducts();

    try {
        const sitemap_items = [
            { url: '', priority: 1 },
            { url: 'products' },
        ];
    
        // Adding all product pages to the sitemap
        sitemap_items.push(
            ...products.map((Product) => ({ url: `product/${Product.productSlug}`, lastmod: Product.updatedAt }))
        );
    
        // Generating sitemaps and sitemap index
        await simpleSitemapAndIndex({
            hostname: 'https://denooj.com',
            destinationDir: './public/sitemaps/',
            sitemapHostname: `https://denooj.com/admin/sitemaps/`,
            sourceData: sitemap_items,
            gzip: false, // Disable gzip compression to store sitemaps in .xml format
        });
    } catch (error) {
        throw new Error(error);
    }
}



