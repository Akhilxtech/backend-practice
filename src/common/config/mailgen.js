
import Mailgen from 'mailgen'

const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Auth Practice',
        link: 'https://yourapp.com'
    }
})

const emailBody = (name,path,btnText,intro,instructions,token)=>{
    const resetLink=`${process.env.BASE_URL}/${path}/${token}`
    return mailGenerator.generate({
        body: {
            name: name,
            intro: intro,
            action: {
                instructions: instructions,
                button: {
                    color: '#22BC66',
                    text: btnText,
                    link: resetLink
                }
            },
            outro: 'If you did not request this, ignore this email.'
        }
    })
}

export {emailBody}



