import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
    constructor(
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>
    ) { }
    async createReview(userId: number, productId: number, reviewData: CreateReviewDto) {
        const alreadyReviewed = await this.reviewRepository.existsBy({ userId, productId });
        if (alreadyReviewed) throw new ConflictException('You already reviewed this product');

        const review = this.reviewRepository.create({
            ...reviewData,
            userId,
            productId,
        });

        return this.reviewRepository.save(review);
    }

    async getProductReviews(productId: number) {
        // Implement logic to retrieve reviews for a specific product
        return this.reviewRepository.find({ where: { productId } });
    }

    async getMyReviews(userId: number) {
        // Implement logic to retrieve reviews written by the currently authenticated user
        return this.reviewRepository.find({ where: { userId } });
    }

    async updateReview(reviewId: number, reviewData: UpdateReviewDto) {
        // Implement logic to update a review with the given review ID using the provided review data
        const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
        if (!review) {
            throw new ConflictException('Review not found');
        }
        Object.assign(review, reviewData);
        return this.reviewRepository.save(review);
    }

    async deleteReview(reviewId: number) {
        // Implement logic to delete the review with the given review ID
        const result = await this.reviewRepository.delete({ id: reviewId });
        if (result.affected === 0) throw new ConflictException('Review not found');
        return { message: 'Review deleted successfully' };
    }
}
