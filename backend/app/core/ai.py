from typing import List

class AIService:
    def analyze_sentiment(self, text: str) -> str:
        """
        Analyze sentiment of text.
        Returns: 'positive', 'negative', or 'neutral'.
        """
        if not text:
            return "neutral"
            
        # Simple heuristic for demo
        negative_words = ['bad', 'poor', 'terrible', 'awful', 'hate', 'slow', 'rude', 'broken', 'dirty']
        positive_words = ['good', 'great', 'excellent', 'love', 'fast', 'friendly', 'clean', 'best']
        
        text_lower = text.lower()
        score = 0
        for w in positive_words:
            if w in text_lower: score += 1
        for w in negative_words:
            if w in text_lower: score -= 1
            
        if score > 0: return "positive"
        if score < 0: return "negative"
        return "neutral"

    def generate_summary(self, texts: List[str]) -> str:
        if not texts: return "No feedback to summarize."
        # Mock summary
        count = len(texts)
        sample = texts[:3]
        return f"AI Summary: Analyzed {count} responses. Key topics include: {', '.join(sample)}..."

ai_service = AIService()
