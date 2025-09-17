import { useState, useEffect } from "react";
import { Instagram, Globe, Download, Eye, CheckCircle, Cog, LogOut, ExternalLink, AlertTriangle, Image, Video, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { DownloadSession, insertDownloadSessionSchema, instagramUrlSchema } from "@shared/schema";
import { z } from "zod";

interface HomeProps {
  token: string;
  onLogout: () => void;
}

// Define form validation schema
const formSchema = insertDownloadSessionSchema.extend({
  instagramUrl: instagramUrlSchema,
});

type FormData = z.infer<typeof formSchema>;

export default function Home({ token, onLogout }: HomeProps) {
  const [session, setSession] = useState<DownloadSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      instagramUrl: "",
      quality: "highest",
      contentType: "all",
    },
  });

  const authHeaders = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (session && session.status === 'processing') {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/download/status/${session.id}`, {
            headers: { "Authorization": `Bearer ${token}` },
          });

          if (response.ok) {
            const updatedSession = await response.json();
            setSession(updatedSession);

            if (updatedSession.status === 'completed' || updatedSession.status === 'failed') {
              clearInterval(pollInterval);
            }
          }
        } catch (error) {
          console.error('Failed to poll session status:', error);
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [session, token]);

  const handleStartDownload = async (formData: FormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/download/create", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Download Started",
          description: "Processing your Instagram profile...",
        });

        // Get initial session data
        const sessionResponse = await fetch(`/api/download/status/${data.sessionId}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setSession(sessionData);
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to start download",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start download process",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!session || session.status !== 'completed') return;

    try {
      const response = await fetch(`/api/download/file/${session.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `instagram_${session.profileData?.username || 'profile'}_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download Complete",
          description: "Your Instagram profile archive has been downloaded",
        });
      } else {
        toast({
          title: "Download Failed",
          description: "Failed to download the archive file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSession(null);
    form.reset();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Instagram className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Instagram Profile Downloader</h1>
                <p className="text-sm text-muted-foreground">Secure media extraction tool</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">Secure Connection</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* URL Input Section */}
        {!session && (
          <div className="mb-8">
            <div className="gradient-border">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <ExternalLink className="w-5 h-5 mr-2 text-primary" />
                  Profile URL
                </h2>

                <Form {...form}>
                  <form noValidate onSubmit={form.handleSubmit(handleStartDownload)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="instagramUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram Profile URL</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="url"
                                placeholder="https://www.instagram.com/username/"
                                className="pr-10 font-mono text-sm"
                                data-testid="input-profile-url"
                                {...field}
                              />
                              <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Only public profiles are supported. Private profiles cannot be accessed.
                          </p>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Media Quality</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger data-testid="select-quality">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="highest">Highest Available (Default)</SelectItem>
                                  <SelectItem value="high">High (Faster)</SelectItem>
                                  <SelectItem value="medium">Medium (Balanced)</SelectItem>
                                  <SelectItem value="low">Low (Fastest)</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Type</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger data-testid="select-content-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Content</SelectItem>
                                  <SelectItem value="images">Images Only</SelectItem>
                                  <SelectItem value="videos">Videos Only</SelectItem>
                                  <SelectItem value="stories">Stories Only</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !form.formState.isValid}
                      data-testid="button-start-download"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isLoading ? "Starting..." : "Start Download"}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        )}

        {/* Download Progress Section */}
        {session && session.status === 'processing' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cog className="w-5 h-5 mr-2 text-primary animate-spin" />
                Processing Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.profileData && (
                <div className="flex items-center space-x-4 p-4 bg-secondary rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium" data-testid="text-profile-name">
                      @{session.profileData.username}
                    </h4>
                    <p className="text-sm text-muted-foreground" data-testid="text-profile-stats">
                      Posts: {session.profileData.postsCount} • Followers: {session.profileData.followersCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Processing profile...</span>
                  <span className="text-sm text-primary" data-testid="text-progress">
                    {session.progress}%
                  </span>
                </div>
                <Progress value={session.progress} className="w-full" data-testid="progress-bar" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Profile validation complete</span>
                </div>
                {session.progress > 25 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Media extraction in progress</span>
                  </div>
                )}
                {session.progress > 50 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Cog className="w-4 h-4 text-primary animate-spin" />
                    <span>Creating archive...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Preview Section */}
        {session && session.mediaStats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-primary" />
                Media Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Image className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-images-count">
                    {session.mediaStats.images}
                  </div>
                  <div className="text-sm text-muted-foreground">Images</div>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-videos-count">
                    {session.mediaStats.videos}
                  </div>
                  <div className="text-sm text-muted-foreground">Videos</div>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-stories-count">
                    {session.mediaStats.stories}
                  </div>
                  <div className="text-sm text-muted-foreground">Stories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Download Ready Section */}
        {session && session.status === 'completed' && (
          <div className="gradient-border">
            <div className="p-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Download Ready!</h3>
                <p className="text-muted-foreground mb-4">
                  Your media archive has been prepared and is ready for download.
                </p>
              </div>

              <Card className="bg-secondary mb-6">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Total Files:</span>
                      <span className="font-medium" data-testid="text-total-files">
                        {session.mediaStats?.total || 0} files
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <span className="font-medium" data-testid="text-quality">
                        {session.quality.charAt(0).toUpperCase() + session.quality.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Images:</span>
                      <span className="font-medium">{session.mediaStats?.images || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Videos:</span>
                      <span className="font-medium">{session.mediaStats?.videos || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button
                  onClick={handleDownloadZip}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-download-zip"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download ZIP Archive
                </Button>

                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="w-full"
                  data-testid="button-new-download"
                >
                  Start New Download
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Secure download • Files auto-expire in 24 hours</span>
                  </div>
                  <div>Archive contains: /images, /videos, /stories folders</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Failed State */}
        {session && session.status === 'failed' && (
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Download Failed</h3>
              <p className="text-muted-foreground mb-4">
                Failed to process the Instagram profile. This could be due to:
              </p>
              <ul className="text-sm text-muted-foreground mb-4 space-y-1">
                <li>• Profile is private or doesn't exist</li>
                <li>• Network connectivity issues</li>
                <li>• Instagram rate limiting</li>
              </ul>
              <Button onClick={resetForm} data-testid="button-retry">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="mt-8 bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-500 mb-1">Important Security Notice</p>
                <p className="text-muted-foreground">
                  This tool only accesses publicly available content. Downloaded files are temporarily stored 
                  and automatically deleted after 24 hours. Ensure you have permission to download and use the 
                  content according to Instagram's Terms of Service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
