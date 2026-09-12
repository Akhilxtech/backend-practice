import ImageKit from '@imagekit/nodejs';

const imageKitClient=new ImageKit({
    publicKey:process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey:process.env.IMAGEKIT_PRIVATE_KEY,
    endEndPoint:process.env.IMAGEKIT_URL_ENDPOINT
})



export default imageKitClient