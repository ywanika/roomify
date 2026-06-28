import {useLocation, useNavigate} from "react-router";
import {useEffect, useRef, useState} from "react";
import {generate3DView} from "../../lib/ai.action";
import {Box, Download, DownloadIcon, RefreshCcw, Share2, X} from "lucide-react";
import {Button} from "../../components/ui/Button";

const VisualizerId = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {initialImage, initialRender, name} = location.state || {};

    const hasInitialGenerated = useRef(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(initialImage || null);

    const handleBack = () => {
        navigate('/');
    }

    const runGeneration = async () => {
        if (!initialImage) return;
        try{
            setIsProcessing(true);
            const result = await generate3DView({ sourceImage: initialImage });

            if (result.renderedImage) {
                setCurrentImage(result.renderedImage);
                // todo
            }
        } catch (error){
            console.error('Error generating 3D view:', error);
        } finally {
            setIsProcessing(false);
        }
    }

    useEffect(() => {
        if (!initialImage || hasInitialGenerated.current) return;

        if (initialRender) {
            setCurrentImage(initialRender);
            hasInitialGenerated.current = true;
        }

        hasInitialGenerated.current = true;
        runGeneration();

    }, [initialImage, initialRender])

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />
                    <span className="name">Roomify</span>
                </div>

                <Button onClick={handleBack} size="sm" variant="ghost" className="exit">
                    <X className="icon" /> Exit Editor
                </Button>
            </nav>

            <section className="content">
                <div className="panel">

                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{'Untitled'}</h2>
                            <p className='note'>Created by You</p>
                        </div>
                    </div>

                    <div className="panel-actions">
                        <Button
                            size="sm"
                            onClick={() => {}}
                            className="export"
                            disabled={!currentImage}
                        >
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => {}}
                            className="share"
                            disabled={!currentImage}
                        >
                            <Share2 className="w-4 h-4 mr-2" /> Share
                        </Button>

                    </div>

                    <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render"  className="render-img" />
                        ):(
                            <div className="render-placeholder">
                                {initialImage && (
                                    <img src={initialImage} alt="Original Image" className="render-fallback" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">Rendering...</span>
                                    <span className="subtitle">Generating 3D model</span>
                                </div>
                            </div>
                        )}
                    </div>


                </div>
            </section>
        </div>
    );
};

export default VisualizerId;