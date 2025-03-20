/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import Header from "@/components/ui/header";
import { usePathname } from "next/navigation";

const Index = () => {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [isScraping, setIsScraping] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [userPrompt, setUserPrompt] = useState("");
    const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
    const [isScraped, setIsScraped] = useState(false);

    useEffect(() => {
        const theme = localStorage.getItem("theme");
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
            setIsDarkMode(true);
        }
    }, []);

    const handleScrape = async () => {
        if (!url) return;

        setIsScraping(true);

        // Simulated scraping process
        setTimeout(() => {
            setIsScraping(false);
            setIsScraped(true);

            // Add initial system message
            setChatMessages([
                {
                    role: "system",
                    content: "Website has been scraped successfully. You can now ask questions about the content."
                }
            ]);
        }, 3000);
    };

    const handleSendPrompt = () => {
        if (!userPrompt.trim()) return;

        // Add user message
        setChatMessages(prev => [...prev, { role: "user", content: userPrompt }]);

        // Simulate loading
        setLoading(true);

        // Simulate AI response after a delay
        setTimeout(() => {
            setChatMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: `Here's the information about "${userPrompt}" from the scraped website. This is a simulated response that will be replaced with actual AI-generated content based on the scraped data.`
                }
            ]);
            setLoading(false);
            setUserPrompt("");
        }, 1500);
    };
    const pathname = usePathname();
    const parts = pathname?.split("/") || [];
    const workspaceName = parts[2] || "Workspace"; // Extracts "News" from "/workspace/News"
    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Accent color blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl dark:bg-blue-500/10" />
                <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl dark:bg-purple-500/10" />
            </div>

            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="container mx-auto py-8 px-4 relative">
                <div className="space-y-6 mb-8">
                    <div className="text-left "> {/* Left-aligned text */}
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                            {workspaceName}
                        </h1>
                        <p className="text-muted-foreground">
                            Scrape websites and chat with the content using AI
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {/* Left side - URL input and scrape button */}
                    <div className="col-span-1 backdrop-blur-md bg-card/50 p-4 rounded-xl border border-border/50 shadow-lg space-y-4 h-[200px] flex flex-col self-start">
                        <h2 className="text-lg font-semibold">Website Scraper</h2>

                        <div className="space-y-2">
                            <label htmlFor="url" className="text-sm font-medium">Website URL</label>
                            <Input
                                id="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="bg-background/50 backdrop-blur-sm"
                            />
                        </div>

                        <Button
                            className="w-full bg-primary/90 hover:bg-primary/100 backdrop-blur-sm transition-all duration-300"
                            onClick={handleScrape}
                            disabled={isScraping}
                        >
                            {isScraping ? "Scraping..." : "Scrape Website"}
                        </Button>
                    </div>

                    {/* Right side - Chat interface */}
                    <div className="col-span-2 backdrop-blur-md bg-card/50 p-6 rounded-xl border border-border/50 shadow-lg space-y-4 h-[600px] flex flex-col">
                        <h2 className="text-xl font-semibold">Chat with Website Content</h2>

                        <div className="flex-grow overflow-auto space-y-4 py-2 custom-scrollbar">
                            {chatMessages.length === 0 && !isScraped ? (
                                <p className="text-muted-foreground text-center">
                                    Scrape a website first, then chat with the content.
                                </p>
                            ) : (
                                chatMessages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`${message.role === "user"
                                            ? "ml-auto bg-primary/20 backdrop-blur-md"
                                            : "mr-auto bg-card backdrop-blur-md border border-border/50"
                                            } p-3 rounded-xl max-w-[80%]`}
                                    >
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="relative">
                            <Textarea
                                placeholder={isScraped ? "Ask about the scraped website..." : "Scrape a website first..."}
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                className="resize-none pr-12 bg-background/50 backdrop-blur-sm"
                                rows={3}
                                disabled={!isScraped}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendPrompt();
                                    }
                                }}
                            />
                            <Button
                                className="absolute right-2 bottom-2 p-2 h-8 w-8"
                                onClick={handleSendPrompt}
                                disabled={!isScraped || !userPrompt.trim()}
                                variant="ghost"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Index