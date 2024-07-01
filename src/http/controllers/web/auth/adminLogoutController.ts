import express from 'express';

export const logout = (req: express.Request, res: express.Response) => {
   
    const sessionToken = req.cookies['DENOOJ_APP'];
        
    if(sessionToken) {
        res.clearCookie("DENOOJ_APP");
    }

    req.session.destroy((err) => {
        return res.redirect('/admin/login');
    });
}