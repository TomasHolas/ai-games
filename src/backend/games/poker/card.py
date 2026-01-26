from enum import Enum
from dataclasses import dataclass


class Suit(Enum):
    HEARTS = "♥"
    DIAMONDS = "♦"
    CLUBS = "♣"
    SPADES = "♠"


class Rank(Enum):
    TWO = "2"
    THREE = "3"
    FOUR = "4"
    FIVE = "5"
    SIX = "6"
    SEVEN = "7"
    EIGHT = "8"
    NINE = "9"
    TEN = "10"
    JACK = "J"
    QUEEN = "Q"
    KING = "K"
    ACE = "A"

    @property
    def value_int(self) -> int:
        if self == Rank.ACE:
            return 14
        if self == Rank.KING:
            return 13
        if self == Rank.QUEEN:
            return 12
        if self == Rank.JACK:
            return 11
        return int(self.value)


@dataclass
class Card:
    rank: Rank
    suit: Suit

    def __str__(self):
        return f"{self.rank.value}{self.suit.value}"

    def __repr__(self):
        return self.__str__()
