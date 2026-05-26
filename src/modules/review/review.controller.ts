import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { ReviewService } from './review.service';
import type { CreateReviewDto } from './dto/create-review.dto';
import type { UpdateReviewDto } from './dto/update-review.dto';
import { AuthGuard } from '../auth/presentation/http/guard/auth.guard';

@Controller('review')
export class ReviewController {
    constructor(
        private readonly reviewService: ReviewService
    ) {}
    @Get('me')
    @UseGuards(AuthGuard)
    getMyReviews(
        @Req() req: any
    ) {
        const userId = req.user.sub;
        return this.reviewService.getMyReviews(userId);
    }
    
    @Get('me/:reviewId')
    @UseGuards(AuthGuard)
    getOneMyReview(
        @Param('reviewId') reviewId: number,
        @Req() req: any
    ) {
        const userId = req.user.sub;
        return this.reviewService.getOneMyReview(reviewId, userId);
    }

    @Get('product/:productId')
    getProductReviews(
        @Param('productId') productId: number
    ) {
        return this.reviewService.getProductReviews(productId);
    }
    
    @Get('product/:productId/:reviewId')
    getOneProductReview(
        @Param('reviewId') reviewId: number,
        @Param('productId') productId: number
    ) {
        return this.reviewService.getOneProductReview(reviewId,productId)
    }
    

    
    @Post('product/:productId')
    @UseGuards(AuthGuard)
    createReview(
        @Param('productId') productId: number,
        @Body() reviewData: CreateReviewDto,
        @Req() req
    ) {
        const userId = req.user.sub;
        return this.reviewService.createReview(userId, productId, reviewData);
    }

    @Delete('me/:reviewId')
    @UseGuards(AuthGuard)
    deleteReview(
        @Param('reviewId') reviewId: number,
        @Req() req
    ) {
        const userId = req.user.sub;
        return this.reviewService.deleteReview(reviewId, userId);
    }

    @Patch('me/:reviewId')
    @UseGuards(AuthGuard)
    updateReview(
        @Param('reviewId') reviewId: number,
        @Body() reviewData: UpdateReviewDto,
        @Req() req
    ) {
        const userId = req.user.sub;
        return this.reviewService.updateReview(reviewId, reviewData, userId);
    }
}
