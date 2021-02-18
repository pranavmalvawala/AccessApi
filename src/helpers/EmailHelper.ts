import AWS from 'aws-sdk'

export class EmailHelper {
    static sendEmail(from: string, to: string, subject: string, body: string) {
        return new Promise(async (resolve, reject) => {
            try {
                AWS.config.update({ region: 'us-east-2' });
                const ses = new AWS.SES({ apiVersion: '2010-12-01' });
                const params = {
                    Destination: {
                        ToAddresses: [to]
                    },
                    Message: {
                        Body: { Html: { Charset: "UTF-8", Data: body } },
                        Subject: { Charset: "UTF-8", Data: subject },
                    },
                    Source: from
                };
                const resp = await ses.sendEmail(params).promise();
                resolve();
            } catch (e) { reject(e); }
        });
    }


}