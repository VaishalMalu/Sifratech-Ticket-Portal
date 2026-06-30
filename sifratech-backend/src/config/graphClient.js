require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Fix for msal-node native fetch IPv6 issues
const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');

const msalConfig = {
    auth: {
        clientId: process.env.GRAPH_CLIENT_ID || 'your_client_id',
        authority: `https://login.microsoftonline.com/${process.env.GRAPH_TENANT_ID || 'your_tenant_id'}`,
        clientSecret: process.env.GRAPH_CLIENT_SECRET || 'your_client_secret',
    }
};

const cca = new ConfidentialClientApplication(msalConfig);

const getGraphClient = () => {
    return Client.init({
        authProvider: async (done) => {
            try {
                const clientCredentialRequest = {
                    scopes: ['https://graph.microsoft.com/.default'],
                };
                const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
                done(null, response.accessToken);
            } catch (error) {
                console.error("Error acquiring token for Graph API", error);
                done(error, null);
            }
        }
    });
};

module.exports = {
    getGraphClient
};
