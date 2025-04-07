import { AppHeader } from '@/components/app-header';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Computer, Shield, FileText, UserCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Block {
    index: number;
    timestamp: string;
    data: {
        type: 'verification' | 'moderation' | 'listing';
        action: string;
        user_id: number;
        details: Record<string, any>;
    };
    previousHash: string;
    hash: string;
}

interface BlockchainProps {
    blocks: Block[];
    userVerificationStatus: {
        isVerified: boolean;
        verificationBlock?: Block;
    };
}

export default function Blockchain({ blocks: initialBlocks = [], userVerificationStatus }: BlockchainProps) {
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks || []);
    const [isLoading, setIsLoading] = useState(false);

    const getBlockTypeIcon = (type: string) => {
        switch (type) {
            case 'verification':
                return <Shield className="h-4 w-4" />;
            case 'moderation':
                return <AlertCircle className="h-4 w-4" />;
            case 'listing':
                return <FileText className="h-4 w-4" />;
            default:
                return <Computer className="h-4 w-4" />;
        }
    };

    const getBlockTypeColor = (type: string) => {
        switch (type) {
            case 'verification':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'moderation':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'listing':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const refreshBlockchain = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(route('blockchain.index'));
            if (response.data && response.data.blocks) {
                setBlocks(response.data.blocks);
            }
        } catch (error) {
            console.error('Error fetching blockchain data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head title="Blockchain" />
            <AppHeader />

            <div className="container mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Blockchain Explorer</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        View the immutable record of verifications and moderation actions
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Verification Status</CardTitle>
                            <CardDescription>
                                View your identity verification status on the blockchain
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {userVerificationStatus.isVerified ? (
                                <div className="flex items-center gap-3">
                                    <UserCheck className="h-6 w-6 text-green-500" />
                                    <div>
                                        <p className="font-medium">Verified Identity</p>
                                        <p className="text-sm text-gray-500">
                                            Block #{userVerificationStatus.verificationBlock?.index}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                                    <p>Not Verified</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Blockchain Stats</CardTitle>
                            <CardDescription>
                                Overview of the blockchain network
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Total Blocks</p>
                                    <p className="text-2xl font-bold">{blocks?.length || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Latest Block</p>
                                    <p className="text-2xl font-bold">#{blocks?.[0]?.index || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Blockchain History</h2>
                        <Button
                            variant="outline"
                            onClick={refreshBlockchain}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>

                    <div className="mt-4 h-[600px] overflow-y-auto rounded-md border">
                        <div className="space-y-4 p-4">
                            {blocks.map((block) => (
                                <div
                                    key={block.hash}
                                    className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {getBlockTypeIcon(block.data.type)}
                                            <Badge className={getBlockTypeColor(block.data.type)}>
                                                {block.data.type}
                                            </Badge>
                                            <span className="text-sm text-gray-500">
                                                Block #{block.index}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(block.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-sm font-medium">{block.data.action}</p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            User ID: {block.data.user_id}
                                        </p>
                                        {block.data.details && (
                                            <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs dark:bg-gray-800">
                                                {JSON.stringify(block.data.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Hash:</span>
                                        <code className="text-xs">{block.hash}</code>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 