import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, File, FileText, Link as LinkIcon, PlayCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";

interface Resource {
  title: string;
  type: 'pdf' | 'word' | 'excel' | 'bibtex' | 'link' | 'video';
  url?: string;
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  estimatedTime?: number;
}

export default function ResourceItem({ resource }: { resource: Resource }) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const getResourceIcon = () => {
    switch (resource.type) {
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'word':
      case 'excel':
      case 'bibtex': return <File className="h-5 w-5" />;
      case 'link': return <LinkIcon className="h-5 w-5" />;
      case 'video': return <PlayCircle className="h-5 w-5" />;
      default: return <File className="h-5 w-5" />;
    }
  };

  const handleDownload = async () => {
    if (!resource.fileId) {
      toast({
        title: "Error",
        description: "No file ID available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloading(true);
      const response = await api.get(`/uploads/${resource.fileId}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: resource.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.fileName || resource.title || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  // For PDF files with fileId
  if (resource.type === 'pdf' && resource.fileId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getResourceIcon()}
            <span className="font-medium">{resource.title}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // For other files with fileId
  if (resource.fileId) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          {getResourceIcon()}
          <span className="font-medium">{resource.title}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download
            </>
          )}
        </Button>
      </div>
    );
  }

  // For external links
  if (resource.type === 'link' && resource.url) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          <span className="font-medium">{resource.title}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(resource.url, '_blank')}
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Open Link
        </Button>
      </div>
    );
  }

  return null;
}