import { ItemTransformer } from './itemTransformer';
import { ReviewDataCache } from './reviewDataCache';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { D1MembershipInfo, D1ItemUserReview, D1ItemWorkingUserReview } from '../item-review/destiny-tracker.service';
import { TrackerErrorHandler } from './trackerErrorHandler';
import { $q, $http } from 'ngimport';

/**
 * Supports submitting review data to the DTR API.
 *
 * @class ReviewSubmitter
 */
export class ReviewSubmitter {
  $q: any;
  $http: any;
  _trackerErrorHandler: TrackerErrorHandler;
  _loadingTracker: any;
  _reviewDataCache: ReviewDataCache;
  _itemTransformer: ItemTransformer;
  constructor(loadingTracker, reviewDataCache: ReviewDataCache) {
    this._itemTransformer = new ItemTransformer();
    this._trackerErrorHandler = new TrackerErrorHandler();
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
  }

  _getReviewer(membershipInfo) {
    return {
      membershipId: membershipInfo.membershipId,
      membershipType: membershipInfo.platformType,
      displayName: membershipInfo.displayName
    };
  }

  toRatingAndReview(item: DimItem): D1ItemWorkingUserReview {
    return {
      rating: item.userRating,
      review: item.userReview,
      pros: item.pros,
      cons: item.cons
    };
  }

  _submitItemReviewCall(itemReview) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/submit',
      data: itemReview,
      dataType: 'json'
    };
  }

  _submitReviewPromise(item: DimItem, membershipInfo: D1MembershipInfo) {
    const rollAndPerks = this._itemTransformer.getRollAndPerks(item);
    const reviewer = this._getReviewer(membershipInfo);
    const review = this.toRatingAndReview(item);

    const rating = Object.assign(rollAndPerks, review);
    rating.reviewer = reviewer;

    const promise = this.$q
              .when(this._submitItemReviewCall(rating))
              .then(this.$http)
              .then(this._trackerErrorHandler.handleSubmitErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleSubmitErrors.bind(this._trackerErrorHandler));

    this._loadingTracker.addPromise(promise);

    return promise;
  }

  // Submitted data takes a while to wend its way into live reviews.  In the interim, don't lose track of what we sent.
  _eventuallyPurgeCachedData(item) {
    this._reviewDataCache.eventuallyPurgeCachedData(item);
  }

  _markItemAsReviewedAndSubmitted(item: DimItem, membershipInfo: D1MembershipInfo) {
    const review = this.toRatingAndReview(item) as D1ItemUserReview;
    review.isReviewer = true;
    review.reviewer = this._getReviewer(membershipInfo);
    review.timestamp = new Date().toISOString();

    this._reviewDataCache.markItemAsReviewedAndSubmitted(item,
                                                         review);
  }

  submitReview(item, membershipInfo) {
    this._submitReviewPromise(item, membershipInfo)
      .then(this._markItemAsReviewedAndSubmitted(item, membershipInfo))
      .then(this._eventuallyPurgeCachedData(item));
  }
}

