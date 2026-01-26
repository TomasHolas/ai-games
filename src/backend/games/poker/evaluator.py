from enum import IntEnum
from typing import List, Tuple
from collections import Counter
from .card import Card


class HandStrength(IntEnum):
    HIGH_CARD = 1
    PAIR = 2
    TWO_PAIR = 3
    THREE_OF_A_KIND = 4
    STRAIGHT = 5
    FLUSH = 6
    FULL_HOUSE = 7
    FOUR_OF_A_KIND = 8
    STRAIGHT_FLUSH = 9
    ROYAL_FLUSH = 10


def evaluate_hand(
    cards: List[Card],
) -> Tuple[HandStrength, List[int], List[str], List[str]]:
    """
    Evaluates the best 5-card poker hand from a list of 5-7 cards.
    Returns (HandStrength, Kickers, CoreCardsStrings, KickerCardsStrings) tuple.
    """
    if len(cards) < 5:
        ranks = sorted([c.rank.value_int for c in cards], reverse=True)
        # All cards are core for high card < 5
        return (HandStrength.HIGH_CARD, ranks, [str(c) for c in cards], [])

    import itertools

    best_score = (-1, [])
    best_core_str = []
    best_kicker_str = []

    for five_cards in itertools.combinations(cards, 5):
        strength, kicks, core_cards_objs = _evaluate_five(list(five_cards))
        current_score = (strength, kicks)

        if current_score > best_score:
            best_score = current_score
            best_core_str = [str(c) for c in core_cards_objs]
            # Identify kickers by excluding core
            # Safe because core_cards_objs are subset of five_cards list objects
            best_kicker_str = [str(c) for c in five_cards if c not in core_cards_objs]

    return (*best_score, best_core_str, best_kicker_str)


def _evaluate_five(cards: List[Card]) -> Tuple[HandStrength, List[int], List[Card]]:
    # Helper to find cards by rank
    def get_cards_by_rank(r: int) -> List[Card]:
        return [c for c in cards if c.rank.value_int == r]

    ranks = sorted([c.rank.value_int for c in cards], reverse=True)
    suits = [c.suit for c in cards]
    is_flush = len(set(suits)) == 1

    # Check straight
    is_straight = False
    straight_high = 0
    unique_ranks = sorted(list(set(ranks)), reverse=True)

    # Straight detection cards
    straight_cards = []

    if len(unique_ranks) >= 5:
        for i in range(len(unique_ranks) - 4):
            window = unique_ranks[i : i + 5]
            if window[0] - window[4] == 4:
                is_straight = True
                straight_high = window[0]
                # Collect cards matching these ranks
                # Note: If multiple cards have same rank (impossible in 5 cards unless pair, but straight has distinct ranks), works fine.
                straight_cards = [c for c in cards if c.rank.value_int in window]
                break

        # Wheel straight (A, 5, 4, 3, 2)
        if not is_straight and set([14, 5, 4, 3, 2]).issubset(set(unique_ranks)):
            is_straight = True
            straight_high = 5
            straight_cards = [c for c in cards if c.rank.value_int in [14, 5, 4, 3, 2]]

    if is_straight and is_flush:
        if set(ranks) == {14, 13, 12, 11, 10}:
            return (HandStrength.ROYAL_FLUSH, [], cards)  # All 5 are core

        # Sort cards to ensure correct order if needed, but for highlight set is enough.
        return (HandStrength.STRAIGHT_FLUSH, [ranks[0]], cards)

    rank_counts = Counter(ranks)
    counts = rank_counts.most_common()

    if counts[0][1] == 4:
        core = get_cards_by_rank(counts[0][0])
        return (HandStrength.FOUR_OF_A_KIND, [counts[0][0], counts[1][0]], core)

    if counts[0][1] == 3 and counts[1][1] == 2:
        # Full house: All 5 are core
        return (HandStrength.FULL_HOUSE, [counts[0][0], counts[1][0]], cards)

    if is_flush:
        return (HandStrength.FLUSH, ranks, cards)

    if is_straight:
        return (HandStrength.STRAIGHT, [straight_high], straight_cards)

    if counts[0][1] == 3:
        core = get_cards_by_rank(counts[0][0])
        kicks = [counts[0][0]] + sorted([k for k, v in counts if v == 1], reverse=True)
        return (HandStrength.THREE_OF_A_KIND, kicks, core)

    if counts[0][1] == 2 and counts[1][1] == 2:
        # Two Pair: 4 cards are core
        core = get_cards_by_rank(counts[0][0]) + get_cards_by_rank(counts[1][0])
        return (HandStrength.TWO_PAIR, [counts[0][0], counts[1][0], counts[2][0]], core)

    if counts[0][1] == 2:
        core = get_cards_by_rank(counts[0][0])
        kicks = [counts[0][0]] + sorted([k for k, v in counts if v == 1], reverse=True)
        return (HandStrength.PAIR, kicks, core)

    # High Card: Only the highest card is technically the "core" winner?
    # Or just top 1? Or all 5?
    # Usually "High Card Ace" means Ace is the thing.
    # User says "only the winning combination".
    # For High Card, the "combination" is just the high card.
    core = get_cards_by_rank(ranks[0])  # Start with highest
    # If tie, we look at next... but standard view is just highlighting the High Card.
    return (HandStrength.HIGH_CARD, ranks, core)
