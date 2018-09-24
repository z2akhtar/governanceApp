const moment = require('moment');
const EthereumTx = require('ethereumjs-tx');
const solc = require('solc');
const fs = require('fs');
var keythereum = require('keythereum');
const async =  require('async');

const utils = {
    async getCurrentTime () {
        return moment().format('YYYY-MM-DD HH:mm:ss').trim();
    },
      
    async transaction (from,to,value,data){
        return {
            from    : from,
            to      : to,
            data    : data,
            value   : value,
            gasPrice: '0x00',
            gas     : 4700000,
            chainId : 1337
        }
    },

    async deployContract(contractAbi, bytecode, deployedAddress, constructorParameters, web3 /*callback*/) {
        console.log("deployContract");
        try{
            var deployedAddress;
            let deployedContract = new web3.eth.Contract(JSON.parse(contractAbi));
            deployedAddress = await deployedContract.deploy({
                data : bytecode, 
                arguments: constructorParameters
            })
            .send({
                from : deployedAddress,
                gas : 5500000
            });
            // .on('error', function(error){ 
            //     if(!error)
            //         console.log("error", error);
            // })
            // .on('receipt', receipt => {
            //     deployedAddress = receipt.contractAddress;
            //     // implement it on asysn await.
            //     return deployedAddress;
            // })
            // .on('transactionHash', function(transactionHash){
            //     console.log('transactionHash', transactionHash);
            //     //web3.eth.getTransaction(transactionHash);
            //     callback("transactionHash", transactionHash);
            // })
            // .then(transaction => {
            //     console.log("transaction",transaction);
            // });
            return deployedAddress._address;
        } catch (error) {
            console.log("Exception in utils.deployContract(): " + error);
        }    
    },
    
     async sendMethodTransaction (fromAccountAddress, toContractAddress, methodData, privateKey, web3, estimatedGas){//, calleeMethodName,callback) {
        nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
        {
            console.log("nonceToUse ",nonceToUse);
            const txParams = {
                nonce: nonceToUse,
                gasPrice: '0x00',
                gasLimit: 4700000, //estimatedGas, //20000000, // Todo, estimate gas
                from: fromAccountAddress,
                to: toContractAddress,
                value: '0x00',
                data: methodData
            }
            const tx = new EthereumTx(txParams)
            const privateKeyBuffer = new Buffer(privateKey, 'hex');
            tx.sign(privateKeyBuffer);
            const serializedTx = tx.serialize();

            receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
            return receipt;
            // .once('transactionHash',(receipt)=>{
            //     console.log('transactionHash', receipt);
            // })
            // .once('receipt',(receipt)=>{	
            //     console.log('info',"transaction mined successfully");
            //     console.log(calleeMethodName, " receipt", receipt);
            //     return receipt;
            //     //callback("success");
            // })				
            // .once('error',(error)=>{
            //     console.log('Error in ', calleeMethodName, `ERROR:\n${error.message}:${error.stack}`);
            // });
        //});
        }
    },
    
    async estimateGasTransaction (fromAccountAddress, toContractAddress, methodData, web3) {
        return await web3.eth.estimateGas(
            {
                from    : fromAccountAddress,
                to      : toContractAddress,
                data    : methodData
            });
    },
    
    readSolidityContractJSON (filename) {
        var json = JSON.parse(fs.readFileSync(filename, 'utf8'));
        let abi = JSON.stringify(json.abi);
        //console.log("abi ", abi);
        //console.log("bytecode ", json.bytecode);
        return [abi, json.bytecode];
    },

    compileSolidityContract (filename,contractName) {
        let source = fs.readFileSync(filename, 'utf8');
        let compiledContract = solc.compile(source, 1);
        let abi = compiledContract.contracts[":"+contractName].interface;
        let bytecode = compiledContract.contracts[":"+contractName].bytecode;
        //console.log(contractName, " abi ", abi);
        //console.log(contractName, " bytecode ", bytecode);
        return [abi, bytecode];
    },

    getPrivateKeyFromKeyStore (accountAddress, keyStorePath, password) {
        var keyObject = keythereum.importFromFile(accountAddress, keyStorePath);
        var privateKey = keythereum.recover(password, keyObject);
        return privateKey.toString('hex');
    },

    async subscribe (string,web3,callback) {
        web3.eth.subscribe(string,(error,transaction)=>{
            if(error){
                console.log("error",`SUBSCRIBE:\n${error.message}\n${error.stack}`);
            }else{
                callback(transaction);
            }
        });
    },
    
    // to get all events from a submitted transaction to send to node application
    async listen(contract,callback){
        contract.events.allEvents({
            fromBlock: 0,
            toBlock  : 'latest'
        },(err,event)=>{
            if(err){
                console.log('error',`\n${err.message}\n${err.stack}`)
            }else{
                console.log('info',`:\n${event}`);
                callback(event);
            }
        });
    }
}
module.exports = utils;