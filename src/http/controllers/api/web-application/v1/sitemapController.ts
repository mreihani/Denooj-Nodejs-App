import express from 'express';
import { ProductModel, getProducts } from '../../../../../models/product';
const { simpleSitemapAndIndex } = require('sitemap');
import fs from 'fs';

export const generateSitemaps = async(req: express.Request, res: express.Response) => {
    
    //https://denooj.com/admin/sitemaps/sitemap-index.xml
    //https://denooj.com/admin/sitemaps/sitemap-0.xml

    const products = await getProducts();

    try {
        // Remove the file
        let siteMapFilePath = './public/sitemaps/sitemap-index.xml';
        fs.stat(siteMapFilePath, function (err, stats) {
            console.log(stats);//here we got all information of file in stats variable
         
            if (err) {
                return console.error(err);
            }
         
            fs.unlink(siteMapFilePath,function(err){
                if(err) return console.log(err);
                console.log('file deleted successfully');
            });  
        });

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



