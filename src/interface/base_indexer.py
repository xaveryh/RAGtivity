from abc import ABC, abstractmethod
from typing import List

from src.interface.base_datastore import DataItem


class BaseIndexer(ABC):

    @abstractmethod
    def index(self, document_paths: List[str]) -> List[DataItem]:
        pass
