import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    async getOneReview(reviewId: number) {
        return this.reviewRepository.findOne({ where: { id: reviewId } });
    }

    async getOneProductReview(reviewId: number, productId: number) {
        return this.reviewRepository.findOne({ where: { id: reviewId, productId } });
    }

    async getOneMyReview(reviewId: number, userId: number) {
        return this.reviewRepository.findOne({ where: { id: reviewId, userId } });
    }
    async getMyReviews(userId: number) {
        // Implement logic to retrieve reviews written by the currently authenticated user
        return this.reviewRepository.find({ where: { userId } });
    }

    async deleteReview(reviewId: number, userId: number) {
        const result = await this.reviewRepository.delete({ id: reviewId, userId });
        if (result.affected === 0) throw new NotFoundException('Cannot delete review');
        return { message: 'Review deleted successfully' };
    }

    async updateReview(reviewId: number, reviewData: UpdateReviewDto, userId: number) {
        const review = await this.reviewRepository.findOne({ where: { id: reviewId, userId } });
        if (!review) throw new NotFoundException('Cannot update review');
        Object.assign(review, reviewData);
        return this.reviewRepository.save(review);
    }
}
