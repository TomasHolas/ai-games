import React from 'react';
import { Wind, User } from 'lucide-react';

interface ModelIconProps {
    model?: string;
    provider?: string;
    className?: string;
    size?: string | number;
}

const OpenAIIcon = ({ size, className }: { size: string | number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M22.28 9.82L12.48 4.16c-.3-.17-.67-.17-.97 0L1.72 9.82c-.3.17-.48.5-.48.84v11.32c0 .34.18.67.48.84l9.79 5.66c.3.17.67.17.97 0l9.8-5.66c.3-.17.48-.5.48-.84V10.66c0-.34-.18-.67-.48-.84zM12 18.31l-7.16-4.14 1.04-1.81.65.37c.55.35 1.15.69 1.85.69.7 0 1.3-.34 1.85-.69l.65-.37L11.5 20.31s.5-2 .5-2zM12 12V3.94l1.04 1.81.65-.37c.55-.35 1.15-.69 1.85-.69.7 0 1.3.34 1.85.69l.65.37-6.04 10.45zm5.16.22c-.65-.07-1.1-.34-1.4-.73-.3-.39-.4-.88-.22-1.33l.65-1.11 4.35 2.51c.3.17.43.51.34.82-.09.31-.38.54-.7.6l-.1.01-3.02-.77zm-11.4 0c-.32-.06-.61-.29-.7-.6-.09-.31.04-.65.34-.82l4.35-2.51.65 1.11c.18.45.08.94-.22 1.33-.3.39-.75.66-1.4.73l-3.02.77zM12 8.44l-5.11 2.95 1-1.73.65-.37c.55-.35 1.15-.69 1.85-.69.7 0 1.3.34 1.85.69l.65.37-1.04 1.81z" />
    </svg>
);

const AnthropicIcon = ({ size, className }: { size: string | number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M18.82 11.23h-3.92l1.41-1.3c.31-.28.31-.76.03-1.07-.28-.31-.76-.32-1.07-.03l-2.27 2.11L10.73 8.8c-.31-.29-.79-.28-1.07.03-.28.31-.28.79.03 1.07l1.41 1.3h-3.92c-.42 0-.77.34-.77.77s.35.77.77.77h3.92l-1.41 1.3c-.31.28-.31.76-.03 1.07.15.16.35.25.55.25.19 0 .38-.07.52-.22l2.27-2.11 2.27 2.11c.14.15.33.22.52.22.2 0 .4-.09.55-.25.28-.31.28-.79-.03-1.07l-1.41-1.3h3.92c.42 0 .77-.34.77-.77s-.35-.77-.77-.77z" />
    </svg>
);

const GeminiIcon = ({ size, className }: { size: string | number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0c.41 6.53 5.47 11.59 12 12-6.53.41-11.59 5.47-12 12-.41-6.53-5.47-11.59-12-12 6.53-.41 11.59-5.47 12-12z" />
    </svg>
);

const MetaIcon = ({ size, className }: { size: string | number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M14.68 7c.92 0 1.8.34 2.45.96.66.62.99 1.48.92 2.42-.09 1.15-.65 2.14-1.58 2.76-.63.42-1.39.63-2.18.63-.92 0-1.8-.34-2.45-.96-.66-.62-.99-1.48-.92-2.42.09-1.15.65-2.14 1.58-2.76.63-.42 1.39-.63 2.18-.63zm-5.36 0c.79 0 1.55.21 2.18.63.93.62 1.49 1.61 1.58 2.76.07.94-.26 1.8-.92 2.42-.65.62-1.53.96-2.45.96-.79 0-1.55-.21-2.18-.63-.93-.62-1.49-1.61-1.58-2.76-.07-.94.26-1.8.92-2.42.65-.62 1.53-.96 2.45-.96zm12.33 3.65c-.21-2.41-1.33-4.59-3.15-6.14C16.65 3.03 14.39 2.25 12 2.25s-4.65.78-6.5 2.26C3.68 6.06 2.56 8.24 2.35 10.65v.02c-.11 1.34.09 2.68.59 3.92.54 1.34 1.41 2.51 2.52 3.42 2.01 1.64 4.54 2.49 7.04 2.49h.1c2.5 0 5.03-.85 7.04-2.49 1.11-.91 1.98-2.08 2.52-3.42.5-1.24.7-2.58.59-3.92v-.02zM12 21c-2.28 0-4.59-.78-6.42-2.28-1.51-1.23-2.56-2.92-2.95-4.75-.38-1.84-.18-3.76.57-5.41.81-1.78 2.17-3.23 3.84-4.11C8.71 3.59 10.33 3.25 12 3.25s3.29.34 4.96 1.2c1.67.88 3.03 2.33 3.84 4.11.75 1.65.95 3.57.57 5.41-.39 1.83-1.44 3.52-2.95 4.75C16.59 20.22 14.28 21 12 21z" />
    </svg>
);

export const ModelIcon: React.FC<ModelIconProps> = ({ model = "", provider = "", className = "", size = 18 }) => {
    // Normalize input
    const normalizedModel = model.toLowerCase();
    const normalizedProvider = provider.toLowerCase();

    const boxSize = typeof size === 'number' ? size : parseInt(size as string) || 18;

    // Logic to use real image icons where available
    let imgIconSrc = "";
    if (normalizedProvider.includes("openai") || normalizedModel.includes("gpt") || normalizedModel.includes("o3") || normalizedModel.includes("o4")) {
        imgIconSrc = "/icons/chatgpt.png";
    } else if (normalizedProvider.includes("anthropic") || normalizedModel.includes("claude") || normalizedProvider.includes("azure proxy")) {
        imgIconSrc = "/icons/claude.png";
    } else if (normalizedProvider.includes("google") || normalizedModel.includes("gemini")) {
        imgIconSrc = "/icons/google-gemini.png";
    } else if (normalizedModel.includes("phi")) {
        imgIconSrc = "/icons/Phi.png";
    }

    if (imgIconSrc) {
        const isInverted = imgIconSrc === "/icons/chatgpt.png";
        return (
            <div className={`flex items-center justify-center shrink-0 ${className}`} title={`${provider || 'System'} - ${model}`}>
                <img
                    src={imgIconSrc}
                    alt={model}
                    style={{
                        width: boxSize,
                        height: boxSize,
                        objectFit: 'contain',
                        filter: isInverted ? 'invert(1) brightness(1.2)' : 'none'
                    }}
                    className="rounded-sm"
                />
            </div>
        );
    }

    // Determine icon and color based on provider or model name for non-image icons
    let Icon: any = null;
    let colorClass = "text-gray-400";

    if (normalizedProvider === "user" || normalizedModel.includes("human")) {
        Icon = User;
        colorClass = "text-emerald-400";
    } else if (normalizedProvider.includes("openai")) {
        Icon = OpenAIIcon;
        colorClass = "text-emerald-500";
    } else if (normalizedProvider.includes("google") || normalizedModel.includes("gemini")) {
        Icon = GeminiIcon;
        colorClass = "text-sky-500";
    } else if (normalizedProvider.includes("anthropic") || normalizedModel.includes("claude")) {
        Icon = AnthropicIcon;
        colorClass = "text-orange-200";
    } else if (normalizedProvider.includes("mistral") || normalizedModel.includes("mistral")) {
        Icon = Wind;
        colorClass = "text-purple-400";
    } else if (normalizedProvider.includes("meta") || normalizedModel.includes("llama")) {
        Icon = MetaIcon;
        colorClass = "text-blue-600";
    }

    if (Icon) {
        return (
            <div className={`flex items-center justify-center shrink-0 ${className}`} title={`${provider || 'System'} - ${model}`}>
                <Icon size={boxSize} className={colorClass} fill={Icon === User ? "none" : "currentColor"} strokeWidth={Icon === User ? 2.5 : undefined} />
            </div>
        );
    }

    // Default fallback image
    return (
        <div className={`flex items-center justify-center shrink-0 ${className}`} title={`${provider || 'System'} - ${model}`}>
            <img
                src="/icons/default.jpg"
                alt={model || 'Model'}
                style={{
                    width: boxSize,
                    height: boxSize,
                    objectFit: 'cover'
                }}
                className="rounded-sm"
            />
        </div>
    );
};
