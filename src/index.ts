import type { OnInstallHandler, OnTransactionHandler } from '@metamask/snaps-sdk';
import { copyable, divider, heading, panel, text, row } from '@metamask/snaps-sdk';

export const onInstall: OnInstallHandler = async () => {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([
        heading('Thank you for installing HAPI'),
        text('To get more information, visit [snap.hapi.one](https://snap.hapi.one)')
      ]),
    },
  });
};

const setApiKey = async (apiKey: string | null) => {
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: { HAPIKey: apiKey },
    },
  })
}

export const onRpcRequest: OnRpcRequestHandler = ({ origin, request }) => {
  switch (request.method) {
    case 'gethapiapi':
      if (request.params && 'api' in request.params && typeof request.params.api === 'string') {
        setApiKey(request.params.api)
        return snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              text('API Key stored successfully'),
              text('**HAPI** has successfully stored a valid API key in your local MetaMask storage')
            ]),
          }
        })
      }
      throw new Error('Must provide params.api.')
    default:
      throw new Error('Method not found.');
  }
};

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
}) => {

  const persistedData = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  if (persistedData == null || !persistedData.hasOwnProperty('HAPIKey') || persistedData.HAPIKey == null){
    return {
      content: panel([
        heading('Add Api Key'),
	text('Please Visit [snap.hapi.one](https://snap.hapi.one) to get an API key')
      ])}
  }

  const user_address = transaction.from;
  const contract_address =  transaction.to;
  const chain_id =  chainId.split(":")[1];

  const url = 'https://research.hapilabs.one/v1/snap2/'+contract_address+'/'+chain_id+'/'+user_address+'/'+persistedData.HAPIKey.toString();
  let x = await fetch(url);

  let mydata = await x.json();
  let arr = [];

  if (mydata.status == "ok"){
    arr = [
	heading('HAPI Risk Score'),
        divider(),
        row('Score:', text(`**${mydata.data.risk.toString()} ${mydata.data.emoji.toString()}**`)),
        row('Category:', text(`**${mydata.data.category.toString()}**`)),
        text(`**${mydata.data.riskDescriptionHeader.toString()}**`), 
	text(`${mydata.data.riskDescription.toString()}`),
        text(`*To view a detailed breakdown: [terminal.hapi.one](https://terminal.hapi.one/)*`),
        divider()
    ];
    if(mydata.data.scamfari == 1){
        arr.push(text('If you think that the generated Risk Score is incorrect, please make sure to report it to us for a reward:'));
        arr.push(text('[scamfari.com](https://scamfari.com)'));
        arr.push(divider());
    }
    if(mydata.data.tokenSecurity.length!=0){
        arr.push(heading('Contract Issues'));
        arr.push(divider());
        for (const issue of mydata.data.tokenSecurity) {
            arr.push(text(`▪️ ${issue.toString()}`));
        }
        arr.push(divider());
    }
    arr.push(heading('Your HAPI ID'));
    arr.push(divider());
    arr.push(row('Validated:', text(`**${mydata.data.hapiIdValid.toString()}**`)));
    arr.push(row('Trust Score:', text(`**${mydata.data.hapiIdScore.toString()}**`)));
    arr.push(text('*To get more information about HAPI ID, please visit*'));
    arr.push(text('[hapi.one/hapi-id](https://hapi.one/hapi-id)'));
    arr.push(divider());

    arr.push(text('*Powered by HAPI Labs*'));
    arr.push(text('*This score is based on the proprietary algorithms of the HAPI Labs team and private and public malicious data repositories including HAPI Labs own data*'));
    return {
    content: panel(arr)
    };

  } else if(mydata.status =='error'){
	arr.push(heading("Error")); 
	arr.push(text(`${mydata.description.toString()}`)); 
	return {
	    content: panel(arr)
	};
  } else if(mydata.status =='invalidAPI'){
    return {
      type: 'alert',
      content: panel([
        heading('Invalid API Key'),
	text('Please Visit [snap.hapi.one](https://snap.hapi.one) to get an API key')
      ])}
  } else {
    arr.push(heading("Unknown Error")); 
    arr.push(text("An unknown error occured. Please contact the team and try again later")); 
    return {
    content: panel(arr)
    };
  }

};