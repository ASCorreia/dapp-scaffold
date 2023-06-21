import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionMessage, TransactionSignature, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";

import { Program, AnchorProvider, web3, utils, BN } from '@project-serum/anchor';
import idl from "./solanapdas2.json";

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new PublicKey(idl.metadata.address);

export const Swap: FC = () => {
    const { connection } = useConnection();
    const ourWallet = useWallet();

    const [banks, setBanks] = useState([]);

    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions())
        return provider;
    }

    const createBank = async() => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_object, programID, anchProvider);

            const [bank, _] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode("bankaccount"),
                anchProvider.wallet.publicKey.toBuffer(),
            ], program.programId)

            await program.methods.create("WSoS Bank").accounts({
              bank,
              user: anchProvider.wallet.publicKey,
              systemProgram: web3.SystemProgram.programId,
            }).rpc();

            console.log("Wow, new bank was created" + bank.toString());
        }
        catch (error) {
            console.log("Error while creating bank account " + error);
        }
    }

    const getBanks = async () => {
        const anchProvider = getProvider();
        const program = new Program(idl_object, programID, anchProvider);

        try {
            await Promise.all((await connection.getProgramAccounts(programID)).map(async bank => ({
                ...(await program.account.bank.fetch(bank.pubkey)),
                pubKey: bank.pubkey
            }))).then(banks => {
                console.log(banks);
                setBanks(banks);
            })
        }
        catch (error) {
            console.log("Error while getting the bank accounts " + error);
        }
    }

    const depositBank = async(publicKey) => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_object, programID, anchProvider);

            await program.methods.deposit(new BN(0.1 * LAMPORTS_PER_SOL)).accounts({
              bank: publicKey,
              user: anchProvider.wallet.publicKey,
              systemProgram: web3.SystemProgram.programId,
            }).rpc();

            console.log("Deposit done: " + publicKey);
        }
        catch (error) {
            console.log("Error while depositing into bank account" + error);
        }
    }

    const withdrawBank = async(publicKey) => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_object, programID, anchProvider);

            await program.methods.withdraw(new BN(0.1 * LAMPORTS_PER_SOL)).accounts({
                bank: publicKey,
                user: anchProvider.wallet.publicKey,
            }).rpc();

            console.log("Withdraw done: " + publicKey);
        }
        catch (error) {
            console.log("Error while withdrawing from bank account " + error);
        }
    }

    return (
        <>
        {banks.map((bank) => {
            return(
                <div className="md:hero-content flex flex-col">
                    <h1>{bank.name.toString()}</h1>
                    <span>{bank.balance.toString()}</span>
                    <button
                        className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                        onClick={() => depositBank(bank.pubKey)} disabled={!ourWallet.publicKey}
                    >
                        <div className="hidden group-disabled:block ">
                        Wallet not connected
                        </div>
                         <span className="block group-disabled:hidden" >
                            Deposit 0.1 SOL
                        </span>
                    </button>
                    <button
                        className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                        onClick={() => withdrawBank(bank.pubKey)} disabled={!ourWallet.publicKey}
                    >
                        <div className="hidden group-disabled:block ">
                        Wallet not connected
                        </div>
                         <span className="block group-disabled:hidden" >
                            Withdraw 0.1 SOL
                        </span>
                    </button>
                </div>
            )
        })}
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <button
                        className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                        onClick={createBank} disabled={!ourWallet.publicKey}
                    >
                        <div className="hidden group-disabled:block ">
                        Wallet not connected
                        </div>
                         <span className="block group-disabled:hidden" >
                            Create Liquidity Pool
                        </span>
                    </button>
                    <button
                        className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                        onClick={getBanks} disabled={!ourWallet.publicKey}
                    >
                        <div className="hidden group-disabled:block ">
                        Wallet not connected
                        </div>
                         <span className="block group-disabled:hidden" >
                            List Liquidity Pools
                        </span>
                    </button>
             </div>
        </div>
        </>
    );
};
