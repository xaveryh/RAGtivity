from dataclasses import dataclass
from typing import Dict, List, Optional
from src.impl import Datastore, Evaluator, Indexer, Retriever, ResponseGenerator
from src.interface import EvaluationResult


@dataclass
class RAGPipeline:
    """Main RAG pipeline that orchestrates all components."""
    def __init__(self):
        self.datastore = Datastore()
        self.indexer = Indexer(datastore=self.datastore)
        # self.retriever = Retriever(datastore=self.datastore)
        self.response_generator = ResponseGenerator()
        self.evaluator = Evaluator()

    def reset(self) -> None:
        """Reset the datastore."""
        self.datastore.reset()

    def add_documents(self, documents: List[str]) -> None:
        """Index a list of documents."""
        items = self.indexer.index(documents)
        self.datastore.add_items(items)
        print(f"✅ Added {len(items)} items to the datastore.")

    def process_query(self, query: str) -> str:
        search_results = self.datastore.search(query)
        print(f"✅ Found {len(search_results)} results for query: {query}\n")

        for i, result in enumerate(search_results):
            print(f"🔍 Result {i+1}: {result}\n")
        response = self.response_generator.generate_response(query, search_results)
        return response

    def evaluate(
        self, sample_questions: List[Dict[str, str]]
    ) -> List[EvaluationResult]:
        # Evaluate a list of question/answer pairs.
        questions = [item["question"] for item in sample_questions]
        expected_answers = [item["answer"] for item in sample_questions]

        results = []
        for i in range(len(questions)):
            res = self._evaluate_single_question(questions[0], expected_answers[0])
            results.append(res)
  
        for i, result in enumerate(results):
            result_emoji = "✅" if result.is_correct else "❌"
            print(f"{result_emoji} Q {i+1}: {result.question}: \n")
            print(f"Response: {result.response}\n")
            print(f"Expected Answer: {result.expected_answer}\n")
            print(f"Reasoning: {result.reasoning}\n")
            print("--------------------------------")

        number_correct = sum(result.is_correct for result in results)
        print(f"✨ Total Score: {number_correct}/{len(results)}")
        return results

    def _evaluate_single_question(
        self, question: str, expected_answer: str
    ) -> EvaluationResult:
        # Evaluate a single question/answer pair.
        response = self.process_query(question)
        return self.evaluator.evaluate(question, response, expected_answer)
