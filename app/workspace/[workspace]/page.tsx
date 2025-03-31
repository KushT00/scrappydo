/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Loader2, Send } from "lucide-react";
import Header from "@/components/ui/header";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ScrapingSchedule from "./schedule";
import EmailTrigger from "../triggers";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const Index = () => {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [isScraping, setIsScraping] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [userPrompt, setUserPrompt] = useState("");
    const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
    const [isScraped, setIsScraped] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [storageError, setStorageError] = useState<string | null>(null);

    // Get the current pathname for workspace name
    const pathname = usePathname();
    const parts = pathname?.split("/") || [];
    const workspaceName = parts[2] || "Workspace"; // Extracts "News" from "/workspace/News"



    useEffect(() => {
        if (url) {
            console.log("URL updated, triggering handleScrape:", url);
            handleScrape();
        }
    }, [url]);
    
    const fetchStoredUrl = async () => {
        if (!userId) return;
    
        try {
            const path = `${userId}/${workspaceName}/urls.txt`;
            const { data, error } = await supabase.storage.from('scrappydo').download(path);
    
            if (error) {
                console.log("No stored URL found for this workspace.");
                return;
            }
    
            if (data) {
                const storedUrl = await data.text();
                setUrl(storedUrl.trim()); // Triggers useEffect, which calls handleScrape()
            }
        } catch (err) {
            console.error("Error fetching stored URL:", err);
        }
    };
    
    
    
    // Check scrape status and get user ID on page load
    useEffect(() => {
        const checkScrapeStatus = async () => {
            try {
                const response = await fetch("http://localhost:8000/scrape/status");
                const data = await response.json();
                setIsScraped(data.has_content);

                if (data.has_content) {
                    setChatMessages([
                        { role: "system", content: "Website already scraped! You can ask questions now." }
                    ]);
                }
            } catch (error) {
                console.error("Error checking scrape status:", error);
            }
        };


        checkScrapeStatus();
    }, []);

    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) {
                    console.error("Error getting user:", error);
                    return;
                }
                if (data && data.user) {
                    setUserId(data.user.id);
                }
            } catch (error) {
                console.error("Error checking user:", error);
            }
        };
    
        getCurrentUser();
    }, []);
    
    useEffect(() => {
        if (userId) {
            fetchStoredUrl();
        }
    }, [userId, workspaceName]); // Fetch URL when user ID or workspace changes
    

    useEffect(() => {
        const theme = localStorage.getItem("theme");
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
            setIsDarkMode(true);
        }
    }, []);

    // Function to save URL to Supabase storage
    const saveUrlToStorage = async (urlToSave: string) => {
        if (!userId) {
            console.log("No user ID available");
            setStorageError("User not authenticated. Cannot save URL.");
            return false;
        }
    
        try {
            const path = `${userId}/${workspaceName}/urls.txt`;
    
            // Overwrite the file with only the new URL
            const { data, error: uploadError } = await supabase.storage
                .from('scrappydo')
                .upload(path, new Blob([urlToSave]), {
                    upsert: true, // This ensures the file is replaced
                    contentType: 'text/plain'
                });
    
            if (uploadError) {
                console.error("Error saving URL to storage:", uploadError);
                setStorageError(`Failed to save URL to storage: ${uploadError.message}`);
                return false;
            }
    
            // console.log("URL saved successfully to urls.txt");
            setStorageError(null);
            return true;
        } catch (error) {
            console.error("Error in saveUrlToStorage:", error);
            setStorageError(`An error occurred while saving the URL: ${error}`);
            return false;
        }
    };
    
    const handleScrape = async () => {
        // console.log("scrapping", url , "this url")
        if (!url) return;
        setIsScraping(true);

        // Wait for userId to be set before proceeding
        if (!userId) {
            console.log("Waiting for userId...");
            while (!userId) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
            }
        }

        try {
            // First save the URL to storage
            const savedToStorage = await saveUrlToStorage(url);

            // Proceed with scraping
            const response = await fetch("http://localhost:8000/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();
            setIsScraping(false);
            setIsScraped(true);

            const messages = [
                { role: "system", content: "Website scraped successfully! You can ask questions now." },
                { role: "system", content: `Preview: ${data.content.slice(0, 200)}...` }
            ];

            // Add storage status message if applicable
            // if (savedToStorage) {
            //     messages.push({
            //         role: "system",
            //         content: `URL saved to ${workspaceName} workspace.`
            //     });
            // } else if (storageError) {
            //     messages.push({
            //         role: "system",
            //         content: `Note: ${storageError}`
            //     });
            // }

            setChatMessages(messages);
        } catch (error) {
            console.error("Scraping error:", error);
            setIsScraping(false);
            setChatMessages(prev => [...prev, {
                role: "system",
                content: "Error scraping the website. Please check the URL and try again."
            }]);

            if (storageError) {
                setChatMessages(prev => [...prev, {
                    role: "system",
                    content: `Storage error: ${storageError}`
                }]);
            }
        }
    };


    const handleSendPrompt = async () => {
        if (!userPrompt.trim()) return;

        // Add user message to chat
        setChatMessages(prev => [...prev, { role: "user", content: userPrompt }]);
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_prompt: userPrompt,
                    use_scraped_content: true // Make sure to use the scraped content
                }),
            });

            const data = await response.json();
            setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
        } catch (error) {
            console.error("Chat API error:", error);
            setChatMessages(prev => [...prev, {
                role: "system",
                content: "Error communicating with the AI. Please try again."
            }]);
        }

        setLoading(false);
        setUserPrompt("");
    };

    const handleClearContent = async () => {
        try {
            await fetch("http://localhost:8000/scrape/clear", {
                method: "POST"
            });
            setIsScraped(false);
            setChatMessages([{ role: "system", content: "Scraped content has been cleared." }]);
        } catch (error) {
            console.error("Error clearing content:", error);
        }
    };
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
                    <div className="text-left"> {/* Left-aligned text */}
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
                    <div className="w-full  col-span-1 backdrop-blur-md bg-card/50 p-4 rounded-xl border border-border/50 shadow-lg space-y-4 flex flex-col self-start">

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
                            {isScraping ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Scraping...
                                </>
                            ) : (
                                "Scrape Website"
                            )}
                        </Button>

                        {isScraped && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleClearContent}
                            >
                                Clear Scraped Content
                            </Button>
                        )}
                        <ScrapingSchedule
                            onSchedule={(scheduleData) => {
                                console.log('Scheduled Scraping:', scheduleData);
                            }}
                        />
                    </div>

                    {/* Right side - Chat interface and EmailTrigger below it */}
                    <div className="col-span-2 flex flex-col space-y-4">
                        <div className="backdrop-blur-md bg-card/50 p-6 rounded-xl border border-border/50 shadow-lg space-y-4 h-[600px] flex flex-col">
                            <h2 className="text-xl font-semibold">
                                Chat with Website Content {isScraped && <span className="text-sm text-green-500 ml-2">(Content Loaded)</span>}
                            </h2>

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
                                                : message.role === "system"
                                                    ? "mx-auto bg-muted/50 backdrop-blur-md text-center"
                                                    : "mr-auto bg-card backdrop-blur-md border border-border/50"
                                                } p-3 rounded-xl max-w-[80%]`}
                                        >
                                            {message.content.includes("|") ? (
                                                <div className="overflow-auto">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]} >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="text-sm">{message.content}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                                {loading && (
                                    <div className="flex justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <Textarea
                                    placeholder={isScraped ? "Ask about the scraped website..." : "Scrape a website first..."}
                                    value={userPrompt}
                                    onChange={(e) => setUserPrompt(e.target.value)}
                                    className="resize-none pr-12 bg-background/50 backdrop-blur-sm"
                                    rows={3}
                                    disabled={!isScraped || loading}
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
                                    disabled={!isScraped || !userPrompt.trim() || loading}
                                    variant="ghost"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* EmailTrigger component below the chat interface */}
                        <div className=" bg-card/50  rounded-xl  shadow-lg">
                            <EmailTrigger
                                onTriggerSetup={(triggerConfig) => {
                                    console.log('Email Trigger Configured:', triggerConfig);
                                }}
                            />
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Index;