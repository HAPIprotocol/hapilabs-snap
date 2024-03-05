"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onTransaction = void 0;
const onTransaction = async ({ transaction, chainId, }) => {
    // Get tx data
    const user_address = transaction.from;
    const contract_address = transaction.to;
    const chain_id = chainId.split(":")[1];
    const url = "https://research.hapilabs.one/v1/snap/" +
        contract_address +
        "/" +
        chain_id +
        "/" +
        user_address;
    let res;
    try {
        res = await fetch(url);
    }
    catch (error) {
        console.error("Snap connection error", error);
        return {
            insights: {
                "Connection Error": "Unable to connect to snap backend. Please try again later.",
            },
        };
    }
    let data;
    try {
        data = await res.json();
    }
    catch (error) {
        console.error("Snap payload error", error);
        return {
            insights: {
                "Payload Error": "Unable to process request. Please contact the team and try again later.",
            },
        };
    }
    if (data.status == "ok") {
        return {
            insights: {
                "Risk score": data.data.risk.score,
                "Risk category": data.data.risk.category,
                "Type": data.data.type,
                "Public name": data.data.public_name,
                "Contract security": data.data.contract,
                "Token security": data.data.token,
            },
        };
    }
    else if (data.status == "error") {
        return {
            insights: { Error: data.description },
        };
    }
    else {
        return {
            insights: {
                "Unknown Error": "An unknown error occured. Please contact the team and try again later.",
            },
        };
    }
};
exports.onTransaction = onTransaction;
